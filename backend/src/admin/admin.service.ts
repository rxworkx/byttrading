import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, MoreThanOrEqual, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import {
  Asset,
  AssetDepositAddress,
  Investment,
  InvestmentPlan,
  InvestmentStatus,
  Kyc,
  KycStatus,
  NotificationLog,
  NotificationType,
  Role,
  Subscription,
  SubscriptionStatus,
  Referral,
  Transaction,
  TransactionStatus,
  TransactionType,
  User,
  UserAssetDepositAddress,
  UserStatus,
  Wallet,
} from '../database/entities';
import { KycService } from '../kyc/kyc.service';
import { WalletsService } from '../wallets/wallets.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InvestmentsService } from '../investments/investments.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Kyc) private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(InvestmentPlan)
    private readonly planRepo: Repository<InvestmentPlan>,
    @InjectRepository(AssetDepositAddress)
    private readonly assetDepositAddressRepo: Repository<AssetDepositAddress>,
    @InjectRepository(UserAssetDepositAddress)
    private readonly userAssetDepositAddressRepo: Repository<UserAssetDepositAddress>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
    private readonly kycService: KycService,
    private readonly walletsService: WalletsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly investmentsService: InvestmentsService,
    private readonly transactionsService: TransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async getStats() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast7Days,
      pendingKycCount,
      pendingApprovalCount,
      activeSubscriptionsCount,
      activeInvestments,
      platformWallets,
      depositTxs,
      withdrawalTxs,
      pendingDepositTxs,
      pendingWithdrawalTxs,
      profitTxs,
      referralTxs,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { createdAt: MoreThanOrEqual(sevenDaysAgo) } }),
      this.kycRepo.count({ where: { status: KycStatus.PENDING } }),
      this.userRepo.count({ where: { status: UserStatus.AWAITING } }),
      this.subscriptionRepo.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.investmentRepo.find({
        where: [
          { status: InvestmentStatus.ACTIVE },
          { status: InvestmentStatus.AWAITING },
        ],
      }),
      this.walletRepo.find({
        where: { symbol: 'fiat_usd' },
      }),
      this.transactionRepo.find({
        where: { type: TransactionType.DEPOSIT, status: TransactionStatus.COMPLETED },
      }),
      this.transactionRepo.find({
        where: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.COMPLETED },
      }),
      this.transactionRepo.find({
        where: { type: TransactionType.DEPOSIT, status: TransactionStatus.PENDING },
      }),
      this.transactionRepo.find({
        where: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.PENDING },
      }),
      this.transactionRepo.find({
        where: { type: TransactionType.PROFIT_CREDIT, status: TransactionStatus.COMPLETED },
      }),
      this.transactionRepo.find({
        where: { type: TransactionType.REFERRAL_BONUS, status: TransactionStatus.COMPLETED },
      }),
    ]);

    // Withdrawal amounts aren't stored with a consistent sign across every
    // code path that creates them, so every USD sum here is abs()'d to get
    // a true volume total regardless of storage sign.
    const sumUsd = (txs: Transaction[]) =>
      txs.reduce((sum, tx) => sum + Math.abs(Number(tx.usdEquivalent ?? tx.amount)), 0);
    const sumUsdSince = (txs: Transaction[], since: Date) =>
      sumUsd(txs.filter((tx) => tx.createdAt >= since));

    const depositsTotalUsd = sumUsd(depositTxs);
    const withdrawalsTotalUsd = sumUsd(withdrawalTxs);

    return {
      totalUsers,
      newUsersLast7Days,
      pendingKycCount,
      pendingApprovalCount,
      depositsTotalUsd,
      depositsCount: depositTxs.length,
      depositsPendingCount: pendingDepositTxs.length,
      depositsPendingUsd: sumUsd(pendingDepositTxs),
      depositsThisWeekUsd: sumUsdSince(depositTxs, sevenDaysAgo),
      withdrawalsTotalUsd,
      withdrawalsCount: withdrawalTxs.length,
      withdrawalsPendingCount: pendingWithdrawalTxs.length,
      withdrawalsPendingUsd: sumUsd(pendingWithdrawalTxs),
      withdrawalsThisWeekUsd: sumUsdSince(withdrawalTxs, sevenDaysAgo),
      netTransactionsUsd: depositsTotalUsd - withdrawalsTotalUsd,
      activeSubscriptionsCount,
      activeInvestmentsCount: activeInvestments.length,
      activeInvestmentsPrincipal: activeInvestments.reduce(
        (sum, inv) => sum + Number(inv.principal),
        0,
      ),
      totalProfitCreditedUsd: sumUsd(profitTxs),
      totalReferralCommissionsUsd: sumUsd(referralTxs),
      platformUsdBalance: platformWallets.reduce(
        (sum, wallet) => sum + Number(wallet.balance),
        0,
      ),
    };
  }

  // Daily deposit/withdrawal/profit USD volume plus trades placed, for the
  // dashboard charts. Trades are counted by startDate (when principal was
  // locked in). Profit is sourced from Investment.accruals, not PROFIT_CREDIT
  // transactions: a PROFIT_CREDIT transaction only exists once a trade is
  // completed/cancelled and its profit is released to the wallet, so an
  // active trade's accruing profit would never show up here otherwise.
  // Investment.accruals records every accrual event (scheduled or manual) the
  // moment it happens, active trade or not.
  async getDailyActivity(days = 14) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [transactions, investments, accrualRows] = await Promise.all([
      this.transactionRepo.find({
        where: {
          type: In([TransactionType.DEPOSIT, TransactionType.WITHDRAWAL]),
          status: TransactionStatus.COMPLETED,
          createdAt: MoreThanOrEqual(since),
        },
      }),
      this.investmentRepo.find({
        where: { startDate: MoreThanOrEqual(since) },
      }),
      this.investmentRepo.query(
        `SELECT (elem->>'amount')::numeric AS amount,
                (elem->>'accrualDate')::timestamptz AS "accrualDate"
         FROM investments, jsonb_array_elements(accruals) elem
         WHERE (elem->>'accrualDate')::timestamptz >= $1`,
        [since],
      ) as Promise<{ amount: string; accrualDate: Date }[]>,
    ]);

    const series: {
      date: string;
      deposits: number;
      withdrawals: number;
      profit: number;
      trades: number;
    }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dateKey = day.toISOString().slice(0, 10);
      const dayTxs = transactions.filter(
        (tx) => tx.createdAt.toISOString().slice(0, 10) === dateKey,
      );
      const deposits = dayTxs
        .filter((tx) => tx.type === TransactionType.DEPOSIT)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.usdEquivalent ?? tx.amount)), 0);
      const withdrawals = dayTxs
        .filter((tx) => tx.type === TransactionType.WITHDRAWAL)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.usdEquivalent ?? tx.amount)), 0);
      const profit = accrualRows
        .filter((a) => new Date(a.accrualDate).toISOString().slice(0, 10) === dateKey)
        .reduce((sum, a) => sum + Number(a.amount), 0);
      const trades = investments.filter(
        (inv) => inv.startDate.toISOString().slice(0, 10) === dateKey,
      ).length;
      series.push({
        date: dateKey,
        deposits: Math.round(deposits * 100) / 100,
        withdrawals: Math.round(withdrawals * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        trades,
      });
    }
    return series;
  }

  async listUsers() {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    const userIds = users.map((user) => user.id);
    if (userIds.length === 0) return [];

    // Bulk-fetched once for every user rather than reusing the single-user
    // getUserDetail path (findAllForUserWithValue etc), which would be an
    // N+1 query storm across a full user list.
    const [kycRecords, wallets, investments, transactions] = await Promise.all([
      this.kycRepo.find({ where: { userId: In(userIds) } }),
      this.walletRepo.find({
        where: { walletAccount: { userId: In(userIds) } },
        relations: { walletAccount: true },
      }),
      this.investmentRepo.find({ where: { userId: In(userIds) } }),
      this.transactionRepo.find({
        where: {
          userId: In(userIds),
          status: TransactionStatus.COMPLETED,
          type: In([
            TransactionType.DEPOSIT,
            TransactionType.WITHDRAWAL,
            TransactionType.PROFIT_CREDIT,
            TransactionType.REFERRAL_BONUS,
          ]),
        },
      }),
    ]);

    const kycByUserId = new Map(kycRecords.map((kyc) => [kyc.userId, kyc.status]));

    const walletsByUserId = new Map<string, Wallet[]>();
    for (const wallet of wallets) {
      const userId = wallet.walletAccount.userId;
      const list = walletsByUserId.get(userId) ?? [];
      list.push(wallet);
      walletsByUserId.set(userId, list);
    }

    const investmentsByUserId = new Map<string, Investment[]>();
    for (const investment of investments) {
      const list = investmentsByUserId.get(investment.userId) ?? [];
      list.push(investment);
      investmentsByUserId.set(investment.userId, list);
    }

    const transactionsByUserId = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = transactionsByUserId.get(tx.userId) ?? [];
      list.push(tx);
      transactionsByUserId.set(tx.userId, list);
    }

    const sumUsd = (txs: Transaction[], type: TransactionType) =>
      txs
        .filter((tx) => tx.type === type)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.usdEquivalent ?? tx.amount)), 0);

    return users.map((user) => {
      const userWallets = walletsByUserId.get(user.id) ?? [];
      const userInvestments = investmentsByUserId.get(user.id) ?? [];
      const userTransactions = transactionsByUserId.get(user.id) ?? [];

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        status: user.status,
        freeze: user.txLimit?.freeze ?? false,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        kycStatus: kycByUserId.get(user.id) ?? KycStatus.NOT_SUBMITTED,
        balanceUsd: userWallets.reduce(
          (sum, wallet) =>
            sum + Number(wallet.balance) * (this.walletsService.getUsdRate(wallet) ?? 0),
          0,
        ),
        tradesUsd: userInvestments.reduce((sum, inv) => sum + Number(inv.principal), 0),
        activeTradesUsd: userInvestments
          .filter(
            (inv) =>
              inv.status === InvestmentStatus.ACTIVE || inv.status === InvestmentStatus.AWAITING,
          )
          .reduce((sum, inv) => sum + Number(inv.principal), 0),
        earningsUsd: sumUsd(userTransactions, TransactionType.PROFIT_CREDIT),
        referralCommissionUsd: sumUsd(userTransactions, TransactionType.REFERRAL_BONUS),
        depositsUsd: sumUsd(userTransactions, TransactionType.DEPOSIT),
        withdrawalsUsd: sumUsd(userTransactions, TransactionType.WITHDRAWAL),
      };
    });
  }

  async getUserDetail(id: string) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    const [kyc, wallets, subscriptions, investments, transactions] =
      await Promise.all([
        this.kycService.findForUser(id),
        this.walletsService.findAllForUserWithValue(id),
        this.subscriptionsService.findForUser(id),
        this.investmentsService.findForUser(id),
        this.transactionsService.findForUser(id),
      ]);

    const sumUsd = (
      txs: typeof transactions,
      type: TransactionType,
    ) =>
      txs
        .filter((tx) => tx.type === type && tx.status === TransactionStatus.COMPLETED)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.usdEquivalent ?? tx.amount)), 0);

    const pendingDepositsUsd = transactions
      .filter((tx) => tx.type === TransactionType.DEPOSIT && tx.status === TransactionStatus.PENDING)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.usdEquivalent ?? tx.amount)), 0);

    const stats = {
      balanceUsd: wallets.reduce((sum, w) => sum + Number(w.usdValue), 0),
      tradesUsd: investments.reduce((sum, inv) => sum + Number(inv.principal), 0),
      activeTradesUsd: investments
        .filter((inv) => inv.status === InvestmentStatus.ACTIVE || inv.status === InvestmentStatus.AWAITING)
        .reduce((sum, inv) => sum + Number(inv.principal), 0),
      earningsUsd: sumUsd(transactions, TransactionType.PROFIT_CREDIT),
      referralCommissionUsd: sumUsd(transactions, TransactionType.REFERRAL_BONUS),
      depositsUsd: sumUsd(transactions, TransactionType.DEPOSIT),
      pendingDepositsUsd,
      withdrawalsUsd: sumUsd(transactions, TransactionType.WITHDRAWAL),
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        status: user.status,
        txLimit: user.txLimit,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      stats,
      kyc,
      wallets,
      subscriptions,
      investments,
      transactions,
    };
  }

  async getUserReferrals(id: string) {
    const [uplineReferral, downlineReferrals] = await Promise.all([
      this.referralRepo.findOne({ where: { referredId: id }, relations: { referrer: true } }),
      this.referralRepo.find({ where: { referrerId: id }, relations: { referred: true } }),
    ]);

    const toSummary = (u: User) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      referralCode: u.referralCode,
      status: u.status,
    });

    return {
      upline: uplineReferral ? toSummary(uplineReferral.referrer) : null,
      downlines: downlineReferrals.map((r) => toSummary(r.referred)),
    };
  }

  async setUserRole(adminId: string, id: string, role: Role) {
    if (adminId === id && role !== Role.ADMIN) {
      throw new BadRequestException('You cannot remove your own admin role');
    }
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    return this.userRepo.save(user);
  }

  // Entering AWAITING always freezes the account; leaving AWAITING always
  // unfreezes it. A manually applied freeze (via setUserTxLimit) on a
  // non-awaiting user is untouched by status changes that don't involve
  // AWAITING on either end.
  async setUserStatus(id: string, status: UserStatus) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    const wasAwaiting = user.status === UserStatus.AWAITING;
    const isAwaiting = status === UserStatus.AWAITING;
    user.status = status;
    if (isAwaiting) {
      user.txLimit = { ...user.txLimit, freeze: true };
    } else if (wasAwaiting) {
      user.txLimit = { ...user.txLimit, freeze: false };
    }
    return this.userRepo.save(user);
  }

  // Real hard delete: cascades through every owned entity (wallets,
  // transactions, investments, subscriptions, KYC, notifications, referral
  // links) via the FK onDelete: 'CASCADE' declared on each of those entities.
  // Irreversible, no undo. See migration SetNullOnDeleteForOptionalRefs for
  // the one non-owning FK (referredById) that had to be fixed to SET NULL
  // first, or this would throw a foreign key violation for anyone this user
  // referred at signup.
  async deleteUser(adminId: string, id: string) {
    if (adminId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.remove(user);
  }

  async setUserTxLimit(id: string, updates: { freeze?: boolean; maxWithdrawal?: number | null }) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    // Explicit undefined checks rather than a blind spread: the DTO class's
    // declared-but-unset fields exist as real own properties valued
    // undefined, so `{...user.txLimit, ...updates}` would silently wipe out
    // whichever field the caller didn't send.
    const next = { ...user.txLimit };
    if (updates.freeze !== undefined) next.freeze = updates.freeze;
    if (updates.maxWithdrawal !== undefined) next.maxWithdrawal = updates.maxWithdrawal;
    user.txLimit = next;
    return this.userRepo.save(user);
  }

  async updateUserProfile(
    id: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      country?: string;
    },
  ) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    if (updates.email !== undefined && updates.email !== user.email) {
      const existing = await this.userRepo.findOneBy({ email: updates.email });
      if (existing) throw new BadRequestException('Email already in use');
      user.email = updates.email;
    }
    if (updates.firstName !== undefined) user.firstName = updates.firstName;
    if (updates.lastName !== undefined) user.lastName = updates.lastName;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.country !== undefined) user.country = updates.country;

    await this.userRepo.save(user);
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async setUserVerification(
    id: string,
    updates: { isEmailVerified?: boolean; twoFactorEnabled?: boolean },
  ) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    if (updates.isEmailVerified !== undefined) user.isEmailVerified = updates.isEmailVerified;
    if (updates.twoFactorEnabled !== undefined) user.twoFactorEnabled = updates.twoFactorEnabled;
    await this.userRepo.save(user);
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async listUserDepositAddresses(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const [assets, sharedRows, overrideRows] = await Promise.all([
      this.assetRepo.find({ order: { sortOrder: 'ASC' } }),
      this.assetDepositAddressRepo.find(),
      this.userAssetDepositAddressRepo.find({ where: { userId } }),
    ]);
    const sharedBySymbol = new Map(sharedRows.map((row) => [row.symbol, row.address]));
    const overrideBySymbol = new Map(overrideRows.map((row) => [row.symbol, row]));

    return assets.map((asset) => {
      const override = overrideBySymbol.get(asset.symbol);
      return {
        symbol: asset.symbol,
        name: asset.name,
        address: override?.address ?? sharedBySymbol.get(asset.symbol) ?? null,
        isOverride: !!override?.address,
        updatedAt: override?.updatedAt ?? null,
      };
    });
  }

  async setUserDepositAddress(
    adminId: string,
    userId: string,
    symbol: string,
    address: string,
  ) {
    let row = await this.userAssetDepositAddressRepo.findOneBy({
      userId,
      symbol,
    });
    if (!row) {
      row = this.userAssetDepositAddressRepo.create({ userId, symbol });
    }
    row.address = address || null;
    row.updatedByAdminId = adminId;
    return this.userAssetDepositAddressRepo.save(row);
  }

  async listDepositAddresses() {
    const [assets, rows] = await Promise.all([
      this.assetRepo.find({ order: { sortOrder: 'ASC' } }),
      this.assetDepositAddressRepo.find(),
    ]);
    const addressBySymbol = new Map(rows.map((row) => [row.symbol, row]));

    return assets.map((asset) => {
      const row = addressBySymbol.get(asset.symbol);
      return {
        symbol: asset.symbol,
        name: asset.name,
        address: row?.address ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    });
  }

  async listAssets() {
    return this.assetRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async updateAsset(symbol: string, dto: UpdateAssetDto) {
    const asset = await this.assetRepo.findOneBy({ symbol });
    if (!asset) throw new NotFoundException(`Asset ${symbol} not found`);

    if (dto.enabled !== undefined) asset.enabled = dto.enabled;
    if (dto.showInWalletList !== undefined) asset.showInWalletList = dto.showInWalletList;
    if (dto.sortOrder !== undefined) asset.sortOrder = dto.sortOrder;

    return this.assetRepo.save(asset);
  }

  async setDepositAddress(adminId: string, symbol: string, address: string) {
    let row = await this.assetDepositAddressRepo.findOneBy({ symbol });
    if (!row) {
      row = this.assetDepositAddressRepo.create({ symbol });
    }
    row.address = address || null;
    row.updatedByAdminId = adminId;
    return this.assetDepositAddressRepo.save(row);
  }

  // Backs both "Active Trades" and "Tradings": same listing, "active" just
  // maps to the two in-progress statuses instead of one exact status.
  async listInvestments(status?: string, userId?: string) {
    let where: FindOptionsWhere<Investment> | FindOptionsWhere<Investment>[];
    if (status === 'active') {
      where = [
        { status: InvestmentStatus.ACTIVE },
        { status: InvestmentStatus.AWAITING },
      ];
    } else if (status) {
      where = { status: status as InvestmentStatus };
    } else {
      where = {};
    }
    if (userId) {
      where = Array.isArray(where)
        ? where.map((w) => ({ ...w, userId }))
        : { ...where, userId };
    }

    const investments = await this.investmentRepo.find({
      where,
      relations: { user: true, plan: true },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    return investments.map((inv) => ({
      id: inv.id,
      reference: inv.reference,
      userId: inv.userId,
      userName: `${inv.user.firstName} ${inv.user.lastName}`,
      userEmail: inv.user.email,
      planName: inv.plan.name,
      principal: inv.principal,
      profitAccrued: inv.profitAccrued,
      status: inv.status,
      term: inv.term,
      startDate: inv.startDate,
      endDate: inv.endDate,
      completedAt: inv.completedAt,
    }));
  }

  async listAllSubscriptions(userId?: string) {
    const subscriptions = await this.subscriptionRepo.find({
      where: userId ? { userId } : {},
      relations: { user: true, plan: true },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    return subscriptions.map((sub) => {
      const { user, plan, ...rest } = sub;
      return {
        ...rest,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        planName: plan.name,
      };
    });
  }

  async completeInvestment(id: string) {
    return this.investmentsService.adminCompleteInvestment(id);
  }

  async cancelInvestment(id: string) {
    return this.investmentsService.adminCancelInvestment(id);
  }

  // Single dispatch point for the trades status-edit button: COMPLETED and
  // CANCELLED go through the existing methods with their wallet side
  // effects, AWAITING <-> ACTIVE is a plain flag flip since funds are
  // already locked either way.
  async setInvestmentStatus(id: string, status: InvestmentStatus) {
    if (status === InvestmentStatus.COMPLETED) {
      return this.investmentsService.adminCompleteInvestment(id);
    }
    if (status === InvestmentStatus.CANCELLED) {
      return this.investmentsService.adminCancelInvestment(id);
    }
    if (status === InvestmentStatus.ACTIVE || status === InvestmentStatus.AWAITING) {
      const investment = await this.investmentRepo.findOneBy({ id });
      if (!investment) throw new NotFoundException('Trade not found');
      if (
        investment.status !== InvestmentStatus.ACTIVE &&
        investment.status !== InvestmentStatus.AWAITING
      ) {
        throw new BadRequestException('This trade has already ended');
      }
      investment.status = status;
      return this.investmentRepo.save(investment);
    }
    throw new BadRequestException('Unsupported status');
  }

  async deleteInvestment(id: string) {
    await this.investmentsService.remove(id);
  }

  async createManualTransaction(adminId: string, dto: CreateManualTransactionDto) {
    switch (dto.actionType) {
      case 'DEPOSIT': {
        if (!dto.symbol || !dto.amount)
          throw new BadRequestException('Symbol and amount are required');
        return this.walletsService.adminAdjustBalance(
          adminId,
          dto.userId,
          dto.symbol,
          dto.amount,
          dto.note,
          TransactionType.DEPOSIT,
        );
      }
      case 'WITHDRAWAL': {
        if (!dto.symbol || !dto.amount)
          throw new BadRequestException('Symbol and amount are required');
        return this.walletsService.adminAdjustBalance(
          adminId,
          dto.userId,
          dto.symbol,
          new Decimal(dto.amount).abs().negated().toString(),
          dto.note,
          TransactionType.WITHDRAWAL,
        );
      }
      case 'PLACE_TRADE': {
        if (!dto.planId || !dto.amount || !dto.walletSymbol)
          throw new BadRequestException('Plan, amount and wallet are required');
        return this.investmentsService.start(dto.userId, dto.planId, dto.amount, dto.walletSymbol);
      }
      case 'BUY_SUBSCRIPTION': {
        if (!dto.planId || !dto.term || !dto.walletSymbol)
          throw new BadRequestException('Plan, term and wallet are required');
        return this.subscriptionsService.subscribe(
          dto.userId,
          dto.planId,
          dto.term,
          dto.walletSymbol,
        );
      }
      case 'ADJUSTMENT':
      default: {
        if (!dto.symbol || !dto.amount)
          throw new BadRequestException('Symbol and amount are required');
        return this.walletsService.adminAdjustBalance(
          adminId,
          dto.userId,
          dto.symbol,
          dto.amount,
          dto.note,
        );
      }
    }
  }

  async sendNotification(adminId: string, dto: SendNotificationDto) {
    const input = { title: dto.title, body: dto.body, type: dto.type };
    const type = dto.type ?? NotificationType.INFO;

    if (dto.userId) {
      const user = await this.userRepo.findOneBy({ id: dto.userId });
      if (!user) throw new NotFoundException('User not found');
      const result = await this.notificationsService.createForUser(
        dto.userId,
        input,
      );
      if (dto.sendEmail) {
        await this.mailService.sendCustomEmail(user.email, dto.title, dto.body);
      }
      await this.notificationLogRepo.save(
        this.notificationLogRepo.create({
          sentByAdminId: adminId,
          userId: user.id,
          recipientLabel: `${user.firstName} ${user.lastName}`,
          recipientCount: 1,
          type,
          title: dto.title,
          body: dto.body,
          sentEmail: !!dto.sendEmail,
        }),
      );
      return result;
    }

    const users = await this.userRepo.find({ select: { id: true, email: true } });
    const result = await this.notificationsService.createForUsers(
      users.map((u) => u.id),
      input,
    );
    if (dto.sendEmail) {
      await Promise.all(
        users.map((u) =>
          this.mailService.sendCustomEmail(u.email, dto.title, dto.body),
        ),
      );
    }
    await this.notificationLogRepo.save(
      this.notificationLogRepo.create({
        sentByAdminId: adminId,
        userId: null,
        recipientLabel: 'All users',
        recipientCount: users.length,
        type,
        title: dto.title,
        body: dto.body,
        sentEmail: !!dto.sendEmail,
      }),
    );
    return result;
  }

  // Log of every admin "send notification" action (targeted or broadcast),
  // separate from the per-user Notification rows that populate each user's
  // own bell — deleting a log entry here is purely an audit-trail cleanup,
  // it never touches what a user already sees in their notifications.
  async listSentNotifications() {
    return this.notificationLogRepo.find({ order: { createdAt: 'DESC' }, take: 500 });
  }

  async deleteSentNotification(id: string) {
    const log = await this.notificationLogRepo.findOneBy({ id });
    if (!log) throw new NotFoundException('Notification log entry not found');
    await this.notificationLogRepo.remove(log);
  }

  // "Earnings" here means what users themselves earned: trade profit credits
  // and referral commissions, not platform revenue. Same reference/user cell
  // shape as listAllTransactions, so the frontend can reuse that table.
  async getEarnings(userId?: string) {
    const transactions = await this.transactionRepo.find({
      where: {
        type: In([TransactionType.PROFIT_CREDIT, TransactionType.REFERRAL_BONUS]),
        status: TransactionStatus.COMPLETED,
        ...(userId ? { userId } : {}),
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    const totalProfitCredited = transactions
      .filter((tx) => tx.type === TransactionType.PROFIT_CREDIT)
      .reduce((sum, tx) => sum + Number(tx.usdEquivalent ?? tx.amount), 0);
    const totalReferralCommissions = transactions
      .filter((tx) => tx.type === TransactionType.REFERRAL_BONUS)
      .reduce((sum, tx) => sum + Number(tx.usdEquivalent ?? tx.amount), 0);

    return {
      totalProfitCredited,
      totalReferralCommissions,
      transactions: transactions.map((tx) => {
        const { user, ...rest } = tx;
        return {
          ...rest,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
        };
      }),
    };
  }

  // Backs the Transactions / Deposits / Withdrawals / Referral Commissions
  // nav entries: one general ledger, sliced by an optional type filter. A
  // "User" column is included since this spans every account, unlike the
  // single-user transactions table on the user detail page.
  async listAllTransactions(type?: string, status?: string, userId?: string) {
    const where: FindOptionsWhere<Transaction> = {};
    if (type) where.type = type as TransactionType;
    if (status) where.status = status as TransactionStatus;
    if (userId) where.userId = userId;

    const transactions = await this.transactionRepo.find({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    return transactions.map((tx) => {
      const { user, ...rest } = tx;
      return {
        ...rest,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
      };
    });
  }

  // Single dispatch point for the transactions status-edit button. Only
  // PENDING transactions have a meaningful transition (Confirm reuses the
  // deposit-credit side effect, Cancel reuses the withdrawal-refund side
  // effect that reject() already has) — anything else is a no-op guard.
  async setTransactionStatus(id: string, adminId: string, status: TransactionStatus) {
    const tx = await this.transactionRepo.findOneBy({ id });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Only pending transactions can change status');
    }
    if (status === TransactionStatus.COMPLETED) {
      return this.transactionsService.confirm(id, adminId);
    }
    if (status === TransactionStatus.CANCELLED) {
      return this.transactionsService.reject(id, adminId);
    }
    throw new BadRequestException('Unsupported status');
  }

  async deleteTransaction(id: string) {
    await this.transactionsService.remove(id);
  }

  listAllPlans() {
    return this.planRepo.find({ order: { createdAt: 'ASC' } });
  }

  async updatePlan(id: string, updates: UpdatePlanDto) {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) throw new NotFoundException('Plan not found');
    Object.assign(plan, updates);
    return this.planRepo.save(plan);
  }
}
