import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  Asset,
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
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
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

  // Tokens a user can pay a subscription fee with right now: opted in by an
  // admin (Asset.paymentsEnabled) and with a shared company deposit address
  // actually configured, otherwise there's nothing to show them to pay into.
  async paymentOptions() {
    const assets = await this.assetRepo.find({
      where: { paymentsEnabled: true },
      order: { sortOrder: 'ASC' },
    });

    const options = await Promise.all(
      assets.map(async (asset) => {
        const address = await this.walletsService.getDepositAddress(asset.symbol);
        if (!address) return null;
        return {
          symbol: asset.symbol,
          name: asset.name,
          address,
          usdRate: this.walletsService.getUsdRateForAsset(asset),
        };
      }),
    );

    return options.filter((option): option is NonNullable<typeof option> => option != null);
  }

  // Quotes the fee and records the request against the company's shared
  // deposit address for that token, nothing is debited from the user's own
  // wallet. The subscription sits PENDING until an admin confirms the
  // payment transaction (see TransactionsService.confirm), which is what
  // actually activates it.
  async subscribe(
    userId: string,
    planId: string,
    term: PlanTerm,
    symbol: string,
    txHash?: string,
  ) {
    const plan = await this.plansService.findById(planId);
    const priceKey = TERM_PRICING_KEY[term];
    const fee = plan.pricing[priceKey];
    if (fee == null)
      throw new BadRequestException('This plan does not offer that term');

    const asset = await this.assetRepo.findOneBy({ symbol, paymentsEnabled: true });
    if (!asset)
      throw new BadRequestException('That token is not accepted for subscription payments');

    const address = await this.walletsService.getDepositAddress(symbol);
    if (!address)
      throw new BadRequestException('No payment address is configured for that token');

    const feeDecimal = new Decimal(fee);
    const rate = this.walletsService.getUsdRateForAsset(asset);
    const tokenAmount = rate != null && rate > 0 ? feeDecimal.div(rate) : feeDecimal;

    return this.dataSource.transaction(async (manager) => {
      const subscriptionRepo = manager.getRepository(Subscription);
      const subscription = await subscriptionRepo.save(
        subscriptionRepo.create({
          userId,
          planId: plan.id,
          term,
          feePaidUsd: feeDecimal.toFixed(2),
          status: SubscriptionStatus.PENDING,
          expiresAt: null,
        }),
      );

      const txRepo = manager.getRepository(Transaction);
      await txRepo.save(
        txRepo.create({
          userId,
          type: TransactionType.SUBSCRIPTION,
          status: TransactionStatus.PENDING,
          amount: tokenAmount.toFixed(8),
          currencySymbol: symbol,
          usdEquivalent: feeDecimal.toFixed(2),
          destinationAddress: address,
          txHash: txHash ?? null,
          relatedSubscriptionId: subscription.id,
        }),
      );

      return subscription;
    });
  }

  // Called by TransactionsService.confirm, inside the same DB transaction,
  // once an admin confirms the payment transaction a subscribe() request
  // created. Starts the term window now (not at request time) and folds in
  // the referral bonus the same way an instant subscribe used to.
  async activatePendingSubscription(subscriptionId: string, manager: EntityManager) {
    const subscriptionRepo = manager.getRepository(Subscription);
    const subscription = await subscriptionRepo.findOneBy({ id: subscriptionId });
    if (!subscription || subscription.status !== SubscriptionStatus.PENDING) return null;

    const now = new Date();
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startedAt = now;
    subscription.expiresAt = new Date(
      now.getTime() + TERM_DAYS[subscription.term] * 24 * 60 * 60 * 1000,
    );
    await subscriptionRepo.save(subscription);

    await this.maybeCreditReferralBonus(
      manager,
      subscription.userId,
      new Decimal(subscription.feePaidUsd),
    );

    return subscription;
  }

  // Called by TransactionsService.reject when the payment transaction never
  // pans out.
  async cancelPendingSubscription(subscriptionId: string, manager: EntityManager) {
    const subscriptionRepo = manager.getRepository(Subscription);
    const subscription = await subscriptionRepo.findOneBy({ id: subscriptionId });
    if (!subscription || subscription.status !== SubscriptionStatus.PENDING) return;
    subscription.status = SubscriptionStatus.CANCELLED;
    await subscriptionRepo.save(subscription);
  }

  // Sent after activatePendingSubscription's transaction commits, an SMTP
  // hiccup should never roll back a confirmed payment.
  async notifyActivated(subscriptionId: string) {
    const subscription = await this.subscriptionRepo.findOneBy({ id: subscriptionId });
    if (!subscription) return;
    const [plan, user] = await Promise.all([
      this.plansService.findById(subscription.planId),
      this.dataSource.getRepository(User).findOneBy({ id: subscription.userId }),
    ]);
    if (user) {
      await this.mailService.sendSubscriptionConfirmedEmail(
        user.email,
        user.firstName,
        plan.name,
        TERM_LABEL[subscription.term],
      );
    }
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
