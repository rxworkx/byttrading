import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  PlanTerm,
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

const TERM_DAYS: Record<PlanTerm, number> = {
  [PlanTerm.SIX_MONTHS]: 182,
  [PlanTerm.ONE_YEAR]: 365,
};

const TERM_PRICING_KEY: Record<PlanTerm, '6mo' | '1yr'> = {
  [PlanTerm.SIX_MONTHS]: '6mo',
  [PlanTerm.ONE_YEAR]: '1yr',
};

const TERM_LABEL: Record<PlanTerm, string> = {
  [PlanTerm.SIX_MONTHS]: '6 months',
  [PlanTerm.ONE_YEAR]: '1 year',
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly settingsService: SettingsService,
    private readonly walletsService: WalletsService,
    private readonly mailService: MailService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findForUser(userId: string) {
    return this.subscriptionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: { plan: true },
    });
  }

  async subscribe(
    userId: string,
    planId: string,
    term: PlanTerm,
    walletSymbol: string,
  ) {
    const plan = await this.plansService.findById(planId);
    const priceKey = TERM_PRICING_KEY[term];
    const fee = plan.pricing[priceKey];
    if (fee == null)
      throw new BadRequestException('This plan does not offer that term');

    const subscription = await this.dataSource.transaction(async (manager) => {
      const feeDecimal = new Decimal(fee);
      const debit = await this.walletsService.debitWalletUsdValue(
        userId,
        walletSymbol,
        feeDecimal,
        manager,
      );

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + TERM_DAYS[term] * 24 * 60 * 60 * 1000,
      );
      const subscriptionRepo = manager.getRepository(Subscription);
      const subscription = await subscriptionRepo.save(
        subscriptionRepo.create({
          userId,
          planId: plan.id,
          term,
          feePaidUsd: feeDecimal.toFixed(2),
          status: SubscriptionStatus.ACTIVE,
          expiresAt,
        }),
      );

      const txRepo = manager.getRepository(Transaction);
      await txRepo.save(
        txRepo.create({
          userId,
          walletId: debit.wallet.id,
          type: TransactionType.SUBSCRIPTION,
          status: TransactionStatus.COMPLETED,
          amount: debit.tokenAmount,
          currencySymbol: debit.wallet.symbol,
          usdEquivalent: debit.usdAmount,
          confirmedAt: now,
        }),
      );

      await this.maybeCreditReferralBonus(manager, userId, feeDecimal);

      return subscription;
    });

    // Sent after the transaction commits, an SMTP hiccup should never roll
    // back a real charge.
    const user = await this.dataSource.getRepository(User).findOneBy({ id: userId });
    if (user) {
      await this.mailService.sendSubscriptionConfirmedEmail(
        user.email,
        user.firstName,
        plan.name,
        TERM_LABEL[term],
      );
    }

    return subscription;
  }

  private async maybeCreditReferralBonus(
    manager: EntityManager,
    referredUserId: string,
    feeDecimal: Decimal,
  ) {
    const referralRepo = manager.getRepository(Referral);
    const referral = await referralRepo.findOneBy({
      referredId: referredUserId,
    });
    if (!referral || referral.triggerEvent) return;

    const bonusPercent = await this.settingsService.getValue(
      'referral_bonus_percent',
      5,
    );
    const bonusAmount = feeDecimal.mul(bonusPercent).div(100);
    if (bonusAmount.lte(0)) return;

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
      .plus(bonusAmount)
      .toFixed(8);
    await walletRepo.save(referrerWallet);

    referral.bonusUsd = bonusAmount.toFixed(2);
    referral.triggerEvent = 'first_subscription';
    referral.paidAt = new Date();
    await referralRepo.save(referral);

    const txRepo = manager.getRepository(Transaction);
    await txRepo.save(
      txRepo.create({
        userId: referral.referrerId,
        walletId: referrerWallet.id,
        type: TransactionType.REFERRAL_BONUS,
        status: TransactionStatus.COMPLETED,
        amount: bonusAmount.toFixed(8),
        currencySymbol: 'fiat_usd',
        usdEquivalent: bonusAmount.toFixed(2),
        adminNote: 'Subscription bonus',
        confirmedAt: new Date(),
      }),
    );

    const notificationRepo = manager.getRepository(Notification);
    await notificationRepo.save(
      notificationRepo.create({
        userId: referral.referrerId,
        type: NotificationType.REFERRAL,
        title: 'Referral bonus credited',
        body: `You earned $${bonusAmount.toFixed(2)} for referring a new trader.`,
      }),
    );
  }
}
