import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import {
  DataSource,
  EntityManager,
  LessThanOrEqual,
  Repository,
} from 'typeorm';
import {
  Investment,
  InvestmentAccrualRecord,
  InvestmentPlan,
  InvestmentStatus,
  Notification,
  NotificationType,
  Referral,
  Subscription,
  SubscriptionStatus,
  Transaction,
  TransactionStatus,
  TransactionType,
  User,
  Wallet,
} from '../database/entities';
import { PlansService } from '../plans/plans.service';
import { SettingsService } from '../settings/settings.service';
import { WalletsService } from '../wallets/wallets.service';
import { MailService } from '../mail/mail.service';
import { pickRandomRatePercent } from './rate-range.util';
import { termToMs } from './term.util';

const CRON_INTERVAL_MS =
  Number(process.env.INVESTMENT_CRON_INTERVAL_MS) || 5 * 60 * 1000;

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly settingsService: SettingsService,
    private readonly walletsService: WalletsService,
    private readonly mailService: MailService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findForUser(userId: string) {
    return this.investmentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: { plan: true },
    });
  }

  async start(userId: string, planId: string, principal: string, walletSymbol: string) {
    const plan = await this.plansService.findById(planId);
    const principalDecimal = new Decimal(principal);
    if (principalDecimal.lte(0))
      throw new BadRequestException('Principal must be positive');

    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, planId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    if (!subscription || subscription.expiresAt < new Date()) {
      throw new BadRequestException(
        'You need an active subscription to this bot before trading',
      );
    }

    const investment = await this.dataSource.transaction(async (manager) => {
      const { wallet, tokenAmount } = await this.walletsService.debitWalletUsdValue(
        userId,
        walletSymbol,
        principalDecimal,
        manager,
      );

      const now = new Date();
      const endDate =
        plan.term == null ? null : new Date(now.getTime() + termToMs(plan.term));
      const nextAccrualAt = new Date(now.getTime() + termToMs(plan.payFrequency));

      // Funds are debited from the chosen wallet either way; awaiting just
      // means it isn't accruing yet until an admin approves it.
      const requiresApproval = await this.settingsService.getValue(
        'trades_require_approval',
        false,
      );

      const investmentRepo = manager.getRepository(Investment);
      const investment = await investmentRepo.save(
        investmentRepo.create({
          userId,
          planId: plan.id,
          subscriptionId: subscription.id,
          walletSymbol,
          principal: principalDecimal.toFixed(8),
          lockedAmount: principalDecimal.toFixed(8),
          profitAccrued: '0',
          profitPaid: '0',
          term: plan.term,
          payFrequency: plan.payFrequency,
          payWalletFrequency: plan.payWalletFrequency,
          minTerm: plan.minTerm,
          status: requiresApproval ? InvestmentStatus.AWAITING : InvestmentStatus.ACTIVE,
          startDate: now,
          endDate,
          nextAccrualAt,
        }),
      );

      const txRepo = manager.getRepository(Transaction);
      await txRepo.save(
        txRepo.create({
          userId,
          walletId: wallet.id,
          type: TransactionType.INVESTMENT_LOCK,
          status: TransactionStatus.COMPLETED,
          amount: tokenAmount,
          currencySymbol: walletSymbol,
          usdEquivalent: principalDecimal.toFixed(2),
          relatedInvestmentId: investment.id,
          confirmedAt: now,
        }),
      );

      return investment;
    });

    // Sent after the transaction commits, an SMTP hiccup should never roll
    // back a real debit.
    const user = await this.dataSource.getRepository(User).findOneBy({ id: userId });
    if (user) {
      await this.mailService.sendTradePlacedEmail(
        user.email,
        user.firstName,
        plan.name,
        principalDecimal.toFixed(2),
      );
    }

    return investment;
  }

  async manualAccrual(
    investmentId: string,
    adminId: string,
    input: { ratePercent?: string; amount?: string },
  ) {
    const investment = await this.investmentRepo.findOneBy({
      id: investmentId,
    });
    if (!investment) throw new NotFoundException('Trade not found');
    if (investment.status !== InvestmentStatus.ACTIVE) {
      throw new BadRequestException('Only active trades can be accrued');
    }
    if (!input.amount && !input.ratePercent) {
      throw new BadRequestException('Provide either a rate percent or a direct amount');
    }

    return this.dataSource.transaction(async (manager) => {
      await this.applyAccrual(
        manager,
        investment,
        input.amount
          ? { amount: new Decimal(input.amount) }
          : { ratePercent: new Decimal(input.ratePercent!) },
        true,
        adminId,
      );
      return manager.getRepository(Investment).findOneBy({ id: investmentId });
    });
  }

  @Interval(CRON_INTERVAL_MS)
  async processInvestments() {
    const now = new Date();

    const dueForAccrual = await this.investmentRepo.find({
      where: {
        status: InvestmentStatus.ACTIVE,
        nextAccrualAt: LessThanOrEqual(now),
      },
    });
    for (const investment of dueForAccrual) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const plan = await this.plansService.findById(investment.planId);
          await this.applyScheduledAccruals(manager, investment.id, plan.rateRange);
        });
      } catch (error) {
        this.logger.error(
          `Accrual failed for investment ${investment.id}: ${(error as Error).message}`,
        );
      }
    }

    const dueForCompletion = await this.investmentRepo.find({
      where: { status: InvestmentStatus.ACTIVE, endDate: LessThanOrEqual(now) },
    });
    for (const investment of dueForCompletion) {
      try {
        await this.dataSource.transaction(async (manager) => {
          await this.completeInvestment(manager, investment.id);
        });
      } catch (error) {
        this.logger.error(
          `Completion failed for investment ${investment.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  private async applyAccrual(
    manager: EntityManager,
    investment: Investment,
    input: { ratePercent: Decimal } | { amount: Decimal },
    isManual: boolean,
    adminId?: string,
  ) {
    const investmentRepo = manager.getRepository(Investment);
    const fresh = await investmentRepo.findOneBy({ id: investment.id });
    if (!fresh || fresh.status !== InvestmentStatus.ACTIVE) return;

    const principal = new Decimal(fresh.principal);
    const lockedAmount = new Decimal(fresh.lockedAmount);
    // Rate is always against the original principal (simple interest), not
    // the running lockedAmount, so a fixed rate pays a flat amount every
    // period instead of compounding.
    const profit = 'amount' in input ? input.amount : principal.mul(input.ratePercent).div(100);
    // A direct-amount credit still records an equivalent rate for reporting
    // consistency with rate-driven accruals, since appliedRatePercent isn't nullable.
    const ratePercent =
      'ratePercent' in input
        ? input.ratePercent
        : principal.gt(0)
          ? profit.div(principal).mul(100)
          : new Decimal(0);

    fresh.lockedAmount = lockedAmount.plus(profit).toFixed(8);
    fresh.profitAccrued = new Decimal(fresh.profitAccrued)
      .plus(profit)
      .toFixed(8);

    if (!isManual) {
      const next = new Date(
        fresh.nextAccrualAt.getTime() + termToMs(fresh.payFrequency),
      );
      // No-fixed-cycle investments have no endDate to clamp against, so
      // accrual just keeps rolling forward on schedule indefinitely.
      fresh.nextAccrualAt =
        fresh.endDate && next > fresh.endDate ? fresh.endDate : next;
    }
    const record: InvestmentAccrualRecord = {
      amount: profit.toFixed(8),
      appliedRatePercent: ratePercent.toFixed(3),
      isManual,
      createdByAdminId: adminId ?? null,
      accrualDate: new Date().toISOString(),
    };
    fresh.accruals = [...fresh.accruals, record];

    await investmentRepo.save(fresh);
  }

  // The sweep interval and an investment's payFrequency aren't guaranteed to
  // match (and the sweep can simply run late, or have been down for a
  // stretch), so nextAccrualAt can fall more than one period behind now. Credit
  // every period that's actually elapsed in this one pass instead of only
  // one per sweep tick, so the trade never permanently loses a payout to a
  // slow or interrupted sweep.
  private async applyScheduledAccruals(
    manager: EntityManager,
    investmentId: string,
    rateRange: string,
  ) {
    const investmentRepo = manager.getRepository(Investment);
    const fresh = await investmentRepo.findOneBy({ id: investmentId });
    if (!fresh || fresh.status !== InvestmentStatus.ACTIVE) return;

    const periodMs = termToMs(fresh.payFrequency);
    if (periodMs <= 0) return;

    const now = new Date();
    const principal = new Decimal(fresh.principal);
    let lockedAmount = new Decimal(fresh.lockedAmount);
    let profitAccrued = new Decimal(fresh.profitAccrued);
    let nextAccrualAt = fresh.nextAccrualAt;
    const newRecords: InvestmentAccrualRecord[] = [];

    // Capped so a badly stale nextAccrualAt (e.g. the sweep was down for
    // months on a minutely test plan) can't turn one tick into an unbounded
    // loop; anything beyond this many missed periods is a data problem, not
    // something to silently pay out in full.
    const MAX_PERIODS_PER_PASS = 10_000;
    while (
      nextAccrualAt <= now &&
      (!fresh.endDate || nextAccrualAt < fresh.endDate) &&
      newRecords.length < MAX_PERIODS_PER_PASS
    ) {
      // Rate is against the original principal (simple interest), not the
      // running lockedAmount, so a fixed rate pays the same flat amount
      // every period instead of compounding period over period.
      const ratePercent = new Decimal(pickRandomRatePercent(rateRange));
      const profit = principal.mul(ratePercent).div(100);
      lockedAmount = lockedAmount.plus(profit);
      profitAccrued = profitAccrued.plus(profit);
      newRecords.push({
        amount: profit.toFixed(8),
        appliedRatePercent: ratePercent.toFixed(3),
        isManual: false,
        createdByAdminId: null,
        accrualDate: nextAccrualAt.toISOString(),
      });

      const next = new Date(nextAccrualAt.getTime() + periodMs);
      nextAccrualAt = fresh.endDate && next > fresh.endDate ? fresh.endDate : next;
    }

    if (newRecords.length === 0) return;

    fresh.lockedAmount = lockedAmount.toFixed(8);
    fresh.profitAccrued = profitAccrued.toFixed(8);
    fresh.nextAccrualAt = nextAccrualAt;
    fresh.accruals = [...fresh.accruals, ...newRecords];
    await investmentRepo.save(fresh);
  }

  private async completeInvestment(
    manager: EntityManager,
    investmentId: string,
  ) {
    const investmentRepo = manager.getRepository(Investment);
    const investment = await investmentRepo.findOneBy({ id: investmentId });
    if (!investment || investment.status !== InvestmentStatus.ACTIVE) return;

    const releaseAmount = new Decimal(investment.lockedAmount);
    const { wallet, tokenAmount } = await this.walletsService.creditWalletUsdValue(
      investment.userId,
      investment.walletSymbol,
      releaseAmount,
      manager,
    );

    const now = new Date();
    investment.status = InvestmentStatus.COMPLETED;
    investment.completedAt = now;
    investment.lockedAmount = '0';
    // Payout is all-at-once today (no periodic payout via payWalletFrequency
    // yet), so completion is the moment every accrued profit becomes paid.
    investment.profitPaid = investment.profitAccrued;
    await investmentRepo.save(investment);

    // Split the single token credit above proportionally between principal
    // and profit, purely for the ledger breakdown (the wallet only got
    // credited once, for the combined releaseAmount).
    const totalToken = new Decimal(tokenAmount);
    const principalUsd = new Decimal(investment.principal);
    const profitUsd = new Decimal(investment.profitAccrued);
    const principalToken = releaseAmount.gt(0)
      ? totalToken.mul(principalUsd).div(releaseAmount)
      : new Decimal(0);
    const profitToken = totalToken.minus(principalToken);

    const txRepo = manager.getRepository(Transaction);
    await txRepo.save(
      txRepo.create({
        userId: investment.userId,
        walletId: wallet.id,
        type: TransactionType.PRINCIPAL_RELEASE,
        status: TransactionStatus.COMPLETED,
        amount: principalToken.toFixed(8),
        currencySymbol: investment.walletSymbol,
        usdEquivalent: investment.principal,
        relatedInvestmentId: investment.id,
        confirmedAt: now,
      }),
    );
    await txRepo.save(
      txRepo.create({
        userId: investment.userId,
        walletId: wallet.id,
        type: TransactionType.PROFIT_CREDIT,
        status: TransactionStatus.COMPLETED,
        amount: profitToken.toFixed(8),
        currencySymbol: investment.walletSymbol,
        usdEquivalent: investment.profitAccrued,
        relatedInvestmentId: investment.id,
        confirmedAt: now,
      }),
    );

    const notificationRepo = manager.getRepository(Notification);
    await notificationRepo.save(
      notificationRepo.create({
        userId: investment.userId,
        type: NotificationType.INVESTMENT,
        title: 'Trade cycle completed',
        body: `Your trade completed. $${releaseAmount.toFixed(2)} (principal + profit) has been credited to your wallet.`,
      }),
    );

    const [user, plan] = await Promise.all([
      manager.getRepository(User).findOneBy({ id: investment.userId }),
      manager.getRepository(InvestmentPlan).findOneBy({ id: investment.planId }),
    ]);
    if (user && plan) {
      await this.mailService.sendTradeCompletedEmail(
        user.email,
        user.firstName,
        plan.name,
        principalUsd.toFixed(2),
        profitUsd.toFixed(2),
      );
    }

    await this.maybeCreditReferralCommission(manager, investment);
  }

  // A recurring commission, separate from the one-shot subscription bonus in
  // SubscriptionsService: every time a referred user's trade completes, the
  // referrer gets a cut of the profit made, not deducted from the referee.
  // completeInvestment only ever runs once per investment (guarded by the
  // LOCKED status check above), so this naturally fires once per cycle with
  // no extra idempotency bookkeeping needed.
  private async maybeCreditReferralCommission(
    manager: EntityManager,
    investment: Investment,
  ) {
    const profit = new Decimal(investment.profitAccrued);
    if (profit.lte(0)) return;

    const referralRepo = manager.getRepository(Referral);
    const referral = await referralRepo.findOneBy({
      referredId: investment.userId,
    });
    if (!referral) return;

    const commissionPercent = await this.settingsService.getValue(
      'referral_profit_commission_percent',
      10,
    );
    const commissionAmount = profit.mul(commissionPercent).div(100);
    if (commissionAmount.lte(0)) return;

    const walletRepo = manager.getRepository(Wallet);
    const referrerWallet = await walletRepo.findOne({
      where: {
        symbol: 'fiat_usd',
        walletAccount: { userId: referral.referrerId },
      },
      relations: { walletAccount: true },
      lock: { mode: 'pessimistic_write' },
    });
    if (!referrerWallet) return;

    referrerWallet.balance = new Decimal(referrerWallet.balance)
      .plus(commissionAmount)
      .toFixed(8);
    await walletRepo.save(referrerWallet);

    const txRepo = manager.getRepository(Transaction);
    await txRepo.save(
      txRepo.create({
        userId: referral.referrerId,
        walletId: referrerWallet.id,
        type: TransactionType.REFERRAL_BONUS,
        status: TransactionStatus.COMPLETED,
        amount: commissionAmount.toFixed(8),
        currencySymbol: 'fiat_usd',
        usdEquivalent: commissionAmount.toFixed(2),
        relatedInvestmentId: investment.id,
        adminNote: 'Trade profit commission',
        confirmedAt: new Date(),
      }),
    );

    const notificationRepo = manager.getRepository(Notification);
    await notificationRepo.save(
      notificationRepo.create({
        userId: referral.referrerId,
        type: NotificationType.REFERRAL,
        title: 'Referral commission credited',
        body: `You earned $${commissionAmount.toFixed(2)} in commission from a referred trader's completed cycle.`,
      }),
    );
  }

  async endEarly(userId: string, investmentId: string) {
    const investment = await this.investmentRepo.findOneBy({
      id: investmentId,
    });
    if (!investment || investment.userId !== userId) {
      throw new NotFoundException('Trade not found');
    }
    if (investment.status !== InvestmentStatus.ACTIVE) {
      throw new BadRequestException('Only an active trade can be ended');
    }

    // minTerm was snapshotted onto the investment at start(), not read live
    // off the plan, so an admin editing the plan's minTerm later never
    // changes the rule for a trade already in progress.
    const minTermMs = termToMs(investment.minTerm);
    if (minTermMs > 0) {
      const eligibleAt = new Date(investment.startDate.getTime() + minTermMs);
      if (new Date() < eligibleAt) {
        throw new BadRequestException(
          `This trade can be ended starting ${eligibleAt.toLocaleDateString()}`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Credit any period that came due between the last cron tick and this
      // exact moment before paying out, so an early end never shorts a
      // period that's already elapsed just because the sweep hasn't run yet.
      const plan = await this.plansService.findById(investment.planId);
      await this.applyScheduledAccruals(manager, investment.id, plan.rateRange);
      await this.completeInvestment(manager, investment.id);
      return manager.getRepository(Investment).findOneBy({ id: investment.id });
    });
  }

  // Admin-triggered version of completeInvestment: bypasses the ownership
  // and minTerm checks endEarly enforces for user-initiated exits.
  async adminCompleteInvestment(investmentId: string) {
    const investment = await this.investmentRepo.findOneBy({
      id: investmentId,
    });
    if (!investment) throw new NotFoundException('Trade not found');
    if (investment.status !== InvestmentStatus.ACTIVE) {
      throw new BadRequestException('Only an active trade can be completed');
    }

    return this.dataSource.transaction(async (manager) => {
      const plan = await this.plansService.findById(investment.planId);
      await this.applyScheduledAccruals(manager, investment.id, plan.rateRange);
      await this.completeInvestment(manager, investment.id);
      return manager.getRepository(Investment).findOneBy({ id: investment.id });
    });
  }

  // Cancels a trade early: releases the locked principal only, no profit,
  // back to the wallet it was funded from.
  async adminCancelInvestment(investmentId: string) {
    const investment = await this.investmentRepo.findOneBy({
      id: investmentId,
    });
    if (!investment) throw new NotFoundException('Trade not found');
    if (investment.status !== InvestmentStatus.ACTIVE) {
      throw new BadRequestException('Only an active trade can be cancelled');
    }

    return this.dataSource.transaction(async (manager) => {
      const releaseAmount = new Decimal(investment.lockedAmount);
      const { wallet, tokenAmount } = await this.walletsService.creditWalletUsdValue(
        investment.userId,
        investment.walletSymbol,
        releaseAmount,
        manager,
      );

      const now = new Date();
      const investmentRepo = manager.getRepository(Investment);
      investment.status = InvestmentStatus.CANCELLED;
      investment.cancelledAt = now;
      investment.lockedAmount = '0';
      await investmentRepo.save(investment);

      const txRepo = manager.getRepository(Transaction);
      await txRepo.save(
        txRepo.create({
          userId: investment.userId,
          walletId: wallet.id,
          type: TransactionType.PRINCIPAL_RELEASE,
          status: TransactionStatus.COMPLETED,
          amount: tokenAmount,
          currencySymbol: investment.walletSymbol,
          usdEquivalent: investment.principal,
          relatedInvestmentId: investment.id,
          adminNote: 'Trade cancelled by admin',
          confirmedAt: now,
        }),
      );

      const notificationRepo = manager.getRepository(Notification);
      await notificationRepo.save(
        notificationRepo.create({
          userId: investment.userId,
          type: NotificationType.INFO,
          title: 'Trade cancelled',
          body: `Your trade of $${investment.principal} was cancelled. The principal has been returned to your wallet.`,
        }),
      );

      return investmentRepo.findOneBy({ id: investment.id });
    });
  }

  // Hard delete, real and irreversible. Only COMPLETED/CANCELLED investments
  // qualify — an ACTIVE/AWAITING one still has real funds represented by
  // lockedAmount with no wallet credit on record, so deleting it would make
  // that money vanish. Linked Transactions (INVESTMENT_LOCK,
  // PRINCIPAL_RELEASE, PROFIT_CREDIT, REFERRAL_BONUS) survive the delete and
  // keep their own history, just losing the relatedInvestmentId
  // cross-reference (see migration SetNullOnDeleteForOptionalRefs).
  async remove(investmentId: string) {
    const investment = await this.investmentRepo.findOneBy({ id: investmentId });
    if (!investment) throw new NotFoundException('Trade not found');
    if (
      investment.status !== InvestmentStatus.COMPLETED &&
      investment.status !== InvestmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'This trade must be completed or cancelled before it can be deleted',
      );
    }
    await this.investmentRepo.remove(investment);
  }
}
