import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities';
import { parseDurationToMs } from '../common/duration.util';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetTwoFactorDto } from './dto/set-two-factor.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

function getCookie(req: Request, name: string): string | undefined {
  const value: unknown = req.cookies?.[name];
  return typeof value === 'string' ? value : undefined;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    const common = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      domain,
      path: '/',
    };
    res.cookie('access_token', accessToken, {
      ...common,
      maxAge: parseDurationToMs(
        this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
      ),
    });
    res.cookie('refresh_token', refreshToken, {
      ...common,
      maxAge: parseDurationToMs(
        this.config.get<string>('JWT_REFRESH_TTL') ?? '30d',
      ),
    });
  }

  private clearSessionCookies(res: Response) {
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    res.clearCookie('access_token', { path: '/', domain });
    res.clearCookie('refresh_token', { path: '/', domain });
  }

  @Public()
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(dto);
    this.setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if ('requiresOtp' in result) return result;

    this.setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('admin-login')
  @HttpCode(200)
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.adminLogin(dto);
    this.setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto.ref, dto.code);
    this.setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(
      getCookie(req, 'refresh_token'),
    );
    this.setSessionCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(getCookie(req, 'refresh_token'));
    this.clearSessionCookies(res);
    return { message: 'Logged out' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @Patch('2fa')
  setTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() dto: SetTwoFactorDto,
  ) {
    return this.authService.setTwoFactor(userId, dto.enabled);
  }

  @Patch('auto-withdrawal')
  setAutoWithdrawal(
    @CurrentUser('id') userId: string,
    @Body() dto: SetTwoFactorDto,
  ) {
    return this.authService.setAutoWithdrawal(userId, dto.enabled);
  }

  @Post('change-password')
  @HttpCode(200)
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
