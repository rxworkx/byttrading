import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import Decimal from 'decimal.js';
import { IsNull, Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  Referral,
  Role,
  Token,
  TokenType,
  TransactionType,
  User,
  UserStatus,
} from '../database/entities';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { parseDurationToMs } from '../common/duration.util';
import { generateOpaqueToken, generateOtpCode, hashToken } from './token.util';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Token) private readonly tokenRepo: Repository<Token>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly mailService: MailService,
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing)
      throw new BadRequestException(
        'An account with this email already exists',
      );

    const passwordHash = await argon2.hash(dto.password);
    const referralCode = await this.usersService.generateUniqueReferralCode();

    const defaultStatusSetting = await this.settingsService.getValue<string>(
      'new_user_default_status',
      'AWAITING',
    );
    const defaultStatus =
      defaultStatusSetting === 'ACTIVE' ? UserStatus.ACTIVE : UserStatus.AWAITING;

    const user = await this.usersService.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      country: dto.country,
      referralCode,
      status: defaultStatus,
      txLimit: { freeze: defaultStatus === UserStatus.AWAITING, maxWithdrawal: null },
    });

    await this.walletsService.provisionForUser(user.id);

    let referrer: User | null = null;
    if (dto.referralCode) {
      referrer = await this.tokenRepo.manager.findOneBy(User, {
        referralCode: dto.referralCode,
      });
      if (referrer) {
        await this.referralRepo.save(
          this.referralRepo.create({
            referrerId: referrer.id,
            referredId: user.id,
          }),
        );
      }
    }

    const verifyUrl = await this.createEmailVerificationToken(user);
    await this.mailService.sendWelcomeEmail(user.email, user.firstName, verifyUrl);

    await this.notificationRepo.save(
      this.notificationRepo.create({
        userId: user.id,
        type: NotificationType.INFO,
        title: 'Welcome to BYT Trading',
        body: 'Your account is ready. Fund your wallet and subscribe to a bot when you are set to start trading.',
      }),
    );

    await this.creditSignupBonuses(user, referrer);
    await this.notifyAdminsOfPendingApproval(user);

    // Signup logs the user straight in (consistent with "email verification
    // is optional, not a login gate") so they land on the welcome/pending
    // approval page already signed in, instead of being sent back to /login.
    return this.issueSession(user);
  }

  private async creditSignupBonuses(user: User, referrer: User | null) {
    const registrationBonus = await this.settingsService.getValue(
      'registration_bonus_usd',
      0,
    );
    if (registrationBonus > 0) {
      await this.walletsService.creditBonus(
        user.id,
        new Decimal(registrationBonus),
        TransactionType.ADMIN_ADJUSTMENT,
        'Registration bonus',
      );
      await this.notificationsService.createForUser(user.id, {
        title: 'Registration bonus credited',
        body: `You have received a registration bonus of $${registrationBonus.toFixed(2)}.`,
      });
      await this.mailService.sendCustomEmail(
        user.email,
        'You received a registration bonus',
        `<p>Welcome aboard. A registration bonus of $${registrationBonus.toFixed(2)} has been credited to your wallet.</p>`,
      );
    }

    if (!referrer) return;

    const downlineBonus = await this.settingsService.getValue(
      'downline_bonus_usd',
      0,
    );
    if (downlineBonus > 0) {
      await this.walletsService.creditBonus(
        user.id,
        new Decimal(downlineBonus),
        TransactionType.REFERRAL_BONUS,
        'Referral signup bonus',
      );
      await this.notificationsService.createForUser(user.id, {
        title: 'Referral bonus credited',
        body: `You have received a referral signup bonus of $${downlineBonus.toFixed(2)}.`,
      });
      await this.mailService.sendCustomEmail(
        user.email,
        'You received a referral bonus',
        `<p>A referral signup bonus of $${downlineBonus.toFixed(2)} has been credited to your wallet.</p>`,
      );
    }

    const uplineBonus = await this.settingsService.getValue(
      'upline_bonus_usd',
      0,
    );
    if (uplineBonus > 0) {
      await this.walletsService.creditBonus(
        referrer.id,
        new Decimal(uplineBonus),
        TransactionType.REFERRAL_BONUS,
        'Referral signup bonus',
      );
      await this.notificationsService.createForUser(referrer.id, {
        title: 'Referral bonus credited',
        body: `You have received a referral bonus of $${uplineBonus.toFixed(2)} for referring ${user.firstName} ${user.lastName}.`,
      });
      await this.mailService.sendCustomEmail(
        referrer.email,
        'You received a referral bonus',
        `<p>A referral bonus of $${uplineBonus.toFixed(2)} has been credited to your wallet for referring ${user.firstName} ${user.lastName}.</p>`,
      );
    }
  }

  private async notifyAdminsOfPendingApproval(user: User) {
    const admins = await this.tokenRepo.manager.find(User, {
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    if (!admins.length) return;

    await this.notificationsService.createForUsers(
      admins.map((admin) => admin.id),
      {
        title: 'New account pending approval',
        body: `${user.firstName} ${user.lastName} just signed up.`,
        type: NotificationType.INFO,
        metadata: { userId: user.id },
      },
    );
  }

  private async createEmailVerificationToken(user: User): Promise<string> {
    const rawToken = generateOpaqueToken();
    await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        type: TokenType.EMAIL_VERIFICATION,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    );
    return `${this.config.get<string>('FRONTEND_URL')}/verify-email?token=${rawToken}`;
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.isEmailVerified) {
      const verifyUrl = await this.createEmailVerificationToken(user);
      await this.mailService.sendVerificationEmail(user.email, user.firstName, verifyUrl);
    }
    return {
      message: 'If that account needs verification, an email has been sent.',
    };
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const token = await this.tokenRepo.findOne({
      where: { tokenHash, type: TokenType.EMAIL_VERIFICATION },
    });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    const user = await this.usersService.findById(token.userId);
    if (!user)
      throw new BadRequestException('Invalid or expired verification link');

    user.isEmailVerified = true;
    await this.usersService.save(user);
    token.consumedAt = new Date();
    await this.tokenRepo.save(token);

    return { message: 'Email verified. You can now log in.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Email verification and two factor login are optional account
    // enhancements, not a login gate, so an unverified user can still sign in.
    if (!user.twoFactorEnabled) {
      return this.issueSession(user);
    }

    const code = generateOtpCode();
    const otpToken = await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        type: TokenType.TWO_FACTOR_OTP,
        tokenHash: hashToken(code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      }),
    );
    await this.mailService.sendOtpEmail(user.email, code);

    return { requiresOtp: true, ref: otpToken.id };
  }

  // A simplified entry point for admins: username instead of email, no OTP
  // step, straight to a session. Deliberately generic on failure so it never
  // reveals whether the username exists or the password was wrong.
  async adminLogin(dto: AdminLoginDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (
      !user ||
      user.role !== Role.ADMIN ||
      !(await argon2.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return this.issueSession(user);
  }

  async verifyOtp(ref: string, code: string) {
    const token = await this.tokenRepo.findOne({
      where: { id: ref, type: TokenType.TWO_FACTOR_OTP },
    });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'This code has expired. Please log in again.',
      );
    }
    if (token.attempts >= MAX_OTP_ATTEMPTS) {
      token.consumedAt = new Date();
      await this.tokenRepo.save(token);
      throw new UnauthorizedException(
        'Too many attempts. Please log in again.',
      );
    }
    if (token.tokenHash !== hashToken(code)) {
      token.attempts += 1;
      await this.tokenRepo.save(token);
      throw new UnauthorizedException('Incorrect code');
    }

    token.consumedAt = new Date();
    await this.tokenRepo.save(token);

    const user = await this.usersService.findById(token.userId);
    if (!user) throw new UnauthorizedException('Account no longer exists');

    return this.issueSession(user);
  }

  private async issueSession(user: User) {
    user.lastLoginAt = new Date();
    await this.usersService.save(user);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = generateOpaqueToken();
    await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        type: TokenType.REFRESH,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(
          Date.now() +
            parseDurationToMs(
              this.config.get<string>('JWT_REFRESH_TTL') ?? '30d',
            ),
        ),
      }),
    );

    return {
      user: this.toPublicUser(user),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refresh(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Session expired, please log in again');
    }
    const tokenHash = hashToken(rawRefreshToken);
    const token = await this.tokenRepo.findOne({
      where: { tokenHash, type: TokenType.REFRESH },
    });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    token.consumedAt = new Date();
    await this.tokenRepo.save(token);

    const user = await this.usersService.findById(token.userId);
    if (!user)
      throw new UnauthorizedException('Session expired, please log in again');

    return this.issueSession(user);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await this.tokenRepo.update(
      { tokenHash, type: TokenType.REFRESH, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const rawToken = generateOpaqueToken();
      await this.tokenRepo.save(
        this.tokenRepo.create({
          userId: user.id,
          type: TokenType.PASSWORD_RESET,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }),
      );
      const resetUrl = `${this.config.get<string>('FRONTEND_URL')}/reset-password?token=${rawToken}`;
      await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
    }
    return { message: 'If that account exists, a reset link has been sent.' };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);
    const token = await this.tokenRepo.findOne({
      where: { tokenHash, type: TokenType.PASSWORD_RESET },
    });
    if (!token || token.consumedAt || token.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const user = await this.usersService.findById(token.userId);
    if (!user) throw new BadRequestException('Invalid or expired reset link');

    user.passwordHash = await argon2.hash(newPassword);
    await this.usersService.save(user);
    token.consumedAt = new Date();
    await this.tokenRepo.save(token);

    await this.tokenRepo.update(
      { userId: user.id, type: TokenType.REFRESH, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );

    return {
      message: 'Password reset. You can now log in with your new password.',
    };
  }

  async updateProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      country?: string;
    },
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account no longer exists');

    if (updates.email !== undefined && updates.email !== user.email) {
      const existing = await this.usersService.findByEmail(updates.email);
      if (existing) throw new BadRequestException('Email already in use');
      user.email = updates.email.toLowerCase();
    }
    if (updates.firstName !== undefined) user.firstName = updates.firstName;
    if (updates.lastName !== undefined) user.lastName = updates.lastName;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.country !== undefined) user.country = updates.country;

    await this.usersService.save(user);
    return this.toPublicUser(user);
  }

  async setTwoFactor(userId: string, enabled: boolean) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account no longer exists');

    user.twoFactorEnabled = enabled;
    await this.usersService.save(user);

    return {
      message: enabled
        ? 'Two factor login is now enabled.'
        : 'Two factor login is now disabled.',
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  async setAutoWithdrawal(userId: string, enabled: boolean) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account no longer exists');

    user.autoWithdrawalEnabled = enabled;
    await this.usersService.save(user);

    return {
      message: enabled
        ? 'Auto withdrawal preference saved. This is not active yet.'
        : 'Auto withdrawal preference saved.',
      autoWithdrawalEnabled: user.autoWithdrawalEnabled,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account no longer exists');

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    user.passwordHash = await argon2.hash(newPassword);
    await this.usersService.save(user);

    return { message: 'Password updated.' };
  }

  private toPublicUser(user: User) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
