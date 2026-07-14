import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  Asset,
  AssetDepositAddress,
  User,
  UserAssetDepositAddress,
  Wallet,
  WalletAccount,
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../database/entities';
import { PricesService } from '../prices/prices.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletAccount)
    private readonly walletAccountRepo: Repository<WalletAccount>,
    @InjectRepository(AssetDepositAddress)
    private readonly assetDepositAddressRepo: Repository<AssetDepositAddress>,
    @InjectRepository(UserAssetDepositAddress)
    private readonly userAssetDepositAddressRepo: Repository<UserAssetDepositAddress>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Asset) private readonly assetRepo: Repository<Asset>,
    private readonly pricesService: PricesService,
    private readonly settingsService: SettingsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // Admin managed, one address per asset shared across every user (this is a
  // ledger platform, not real per-user blockchain custody). Always resolved
  // live here rather than cached on the Wallet row, so an admin edit is
  // reflected immediately for any future deposit.
  async getDepositAddress(symbol: string): Promise<string | null> {
    const row = await this.assetDepositAddressRepo.findOneBy({ symbol });
    return row?.address ?? null;
  }

  private async getDepositAddressMap(): Promise<Map<string, string | null>> {
    const rows = await this.assetDepositAddressRepo.find();
    return new Map(rows.map((row) => [row.symbol, row.address]));
  }

  // A user can have a personal override for a specific asset (admin
  // assigned), which takes priority over the shared default above.
  async getResolvedDepositAddress(
    userId: string,
    symbol: string,
  ): Promise<string | null> {
    const override = await this.userAssetDepositAddressRepo.findOneBy({
      userId,
      symbol,
    });
    if (override?.address) return override.address;
    return this.getDepositAddress(symbol);
  }

  private async getUserDepositAddressMap(
    userId: string,
  ): Promise<Map<string, string | null>> {
    const rows = await this.userAssetDepositAddressRepo.find({
      where: { userId },
    });
    return new Map(rows.map((row) => [row.symbol, row.address]));
  }

  private async getSortOrderMap(): Promise<Map<string, number>> {
    const assets = await this.assetRepo.find({
      select: { symbol: true, sortOrder: true },
    });
    return new Map(assets.map((asset) => [asset.symbol, asset.sortOrder]));
  }

  async provisionForUser(userId: string): Promise<WalletAccount> {
    let walletAccount = await this.walletAccountRepo.findOneBy({ userId });
    if (!walletAccount) {
      walletAccount = await this.walletAccountRepo.save(
        this.walletAccountRepo.create({ userId }),
      );
    }

    // Only the fiat balance is provisioned up front. Every other asset
    // wallet is created lazily the first time a user actually deposits into
    // it (see getOrCreateWallet), though the full catalog is still shown in
    // wallet listings via findAllForUserWithValue.
    const fiatAsset = await this.assetRepo.findOneBy({ symbol: 'fiat_usd' });
    if (!fiatAsset) return walletAccount;

    const existingFiatWallet = await this.walletRepo.findOneBy({
      walletAccountId: walletAccount.id,
      symbol: 'fiat_usd',
    });
    if (!existingFiatWallet) {
      await this.walletRepo.insert({
        walletAccountId: walletAccount.id,
        symbol: fiatAsset.symbol,
        apiId: fiatAsset.apiId,
        isFiat: fiatAsset.isFiat,
        fixedRateUsd: fiatAsset.fixedRateUsd,
        balance: '0',
      });
    }

    return walletAccount;
  }

  async findAllForUser(userId: string) {
    const [wallets, sortOrder] = await Promise.all([
      this.walletRepo.find({ where: { walletAccount: { userId } } }),
      this.getSortOrderMap(),
    ]);
    return wallets.sort(
      (a, b) =>
        (sortOrder.get(a.symbol) ?? Number.MAX_SAFE_INTEGER) -
        (sortOrder.get(b.symbol) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  async findAllForUserWithValue(userId: string) {
    // Self-heals accounts created before the catalog grew, so existing users
    // pick up the fiat wallet without a manual migration step.
    await this.provisionForUser(userId);
    const [wallets, assets] = await Promise.all([
      this.walletRepo.find({ where: { walletAccount: { userId } } }),
      this.assetRepo.find(),
    ]);
    const sortOrder = new Map(assets.map((a) => [a.symbol, a.sortOrder]));
    const assetBySymbol = new Map(assets.map((a) => [a.symbol, a]));

    // Assets the user hasn't deposited into yet have no row in the database
    // (see getOrCreateWallet), but the catalog still lists them here with a
    // zero balance so the wallet page and selectors show every asset, minus
    // whatever the admin has disabled or hidden from browsing. A wallet the
    // user already owns with an actual balance is always included regardless
    // of those flags; a real but never-funded zero-balance row (e.g. a stray
    // leftover from before wallets were lazily provisioned) still hides like
    // any other unowned asset once disabled or unlisted.
    const visibleWallets = wallets.filter((wallet) => {
      const asset = assetBySymbol.get(wallet.symbol);
      if (!asset || (asset.enabled && asset.showInWalletList)) return true;
      return new Decimal(wallet.balance).gt(0);
    });
    const existingSymbols = new Set(wallets.map((wallet) => wallet.symbol));
    const virtualWallets = assets
      .filter(
        (asset) =>
          !existingSymbols.has(asset.symbol) &&
          asset.enabled &&
          asset.showInWalletList,
      )
      .map((asset) =>
        this.walletRepo.create({
          id: `virtual:${asset.symbol}`,
          walletAccountId: '',
          symbol: asset.symbol,
          apiId: asset.apiId,
          isFiat: asset.isFiat,
          fixedRateUsd: asset.fixedRateUsd,
          depositAddress: null,
          balance: '0',
        }),
      );

    const all = [...visibleWallets, ...virtualWallets].sort(
      (a, b) =>
        (sortOrder.get(a.symbol) ?? Number.MAX_SAFE_INTEGER) -
        (sortOrder.get(b.symbol) ?? Number.MAX_SAFE_INTEGER),
    );

    const [sharedAddressMap, userAddressMap] = await Promise.all([
      this.getDepositAddressMap(),
      this.getUserDepositAddressMap(userId),
    ]);

    return all.map((wallet) => ({
      ...wallet,
      // Wallet has no name column of its own (removed to avoid a stale copy
      // surviving a later asset rename); always resolve it live instead.
      name: assetBySymbol.get(wallet.symbol)?.name ?? wallet.symbol,
      depositAddress:
        userAddressMap.get(wallet.symbol) ??
        sharedAddressMap.get(wallet.symbol) ??
        null,
      usdRate: this.getUsdRate(wallet),
      usdValue: new Decimal(wallet.balance)
        .mul(this.getUsdRate(wallet) ?? 0)
        .toFixed(2),
    }));
  }

  getUsdRate(wallet: Wallet): number | null {
    if (wallet.fixedRateUsd != null) return Number(wallet.fixedRateUsd);
    if (!wallet.apiId) return null;
    return this.pricesService.getPrice(wallet.apiId);
  }

  // Charges a USD-denominated cost (subscription fees, placing a trade,
  // etc) against exactly the wallet the user picked in the UI. Must run
  // inside the caller's transaction so the debit and whatever it's paying
  // for commit or roll back together.
  async debitWalletUsdValue(
    userId: string,
    symbol: string,
    usdAmount: Decimal,
    manager: EntityManager,
  ): Promise<{ wallet: Wallet; tokenAmount: string; usdAmount: string }> {
    const walletRepo = manager.getRepository(Wallet);
    const wallet = await walletRepo.findOne({
      where: { symbol, walletAccount: { userId } },
      relations: { walletAccount: true },
      lock: { mode: 'pessimistic_write' },
    });
    if (!wallet) throw new NotFoundException(`Wallet ${symbol} not found`);

    const rate = this.getUsdRate(wallet);
    if (rate == null || rate <= 0) {
      throw new BadRequestException(
        'Live price unavailable for this wallet, try again shortly',
      );
    }

    const balance = new Decimal(wallet.balance);
    const walletUsdValue = balance.mul(rate);
    if (walletUsdValue.lt(usdAmount)) {
      throw new BadRequestException('Insufficient balance in this wallet');
    }

    const tokenToDebit = usdAmount.div(rate);
    wallet.balance = balance.minus(tokenToDebit).toFixed(8);
    await walletRepo.save(wallet);

    return {
      wallet,
      tokenAmount: tokenToDebit.toFixed(8),
      usdAmount: usdAmount.toFixed(2),
    };
  }

  // The reverse of debitWalletUsdValue: used to release a trade's principal
  // (and any profit) back to whichever wallet it was originally funded from.
  async creditWalletUsdValue(
    userId: string,
    symbol: string,
    usdAmount: Decimal,
    manager: EntityManager,
  ): Promise<{ wallet: Wallet; tokenAmount: string; usdAmount: string }> {
    const walletRepo = manager.getRepository(Wallet);
    const wallet = await walletRepo.findOne({
      where: { symbol, walletAccount: { userId } },
      relations: { walletAccount: true },
      lock: { mode: 'pessimistic_write' },
    });
    if (!wallet) throw new NotFoundException(`Wallet ${symbol} not found`);

    const rate = this.getUsdRate(wallet);
    if (rate == null || rate <= 0) {
      throw new BadRequestException(
        'Live price unavailable for this wallet, try again shortly',
      );
    }

    const tokenToCredit = usdAmount.div(rate);
    wallet.balance = new Decimal(wallet.balance).plus(tokenToCredit).toFixed(8);
    await walletRepo.save(wallet);

    return {
      wallet,
      tokenAmount: tokenToCredit.toFixed(8),
      usdAmount: usdAmount.toFixed(2),
    };
  }

  // Creates the wallet row on first use (e.g. the first deposit into an
  // asset that was only ever shown as a zero-balance catalog entry before).
  private async getOrCreateWallet(
    userId: string,
    symbol: string,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<Wallet> {
    const walletRepo = manager.getRepository(Wallet);
    const existing = await walletRepo.findOne({
      where: { symbol, walletAccount: { userId } },
      relations: { walletAccount: true },
    });
    if (existing) return existing;

    const asset = await manager
      .getRepository(Asset)
      .findOneBy({ symbol });
    if (!asset) throw new NotFoundException(`Wallet ${symbol} not found`);
    if (!asset.enabled) {
      throw new BadRequestException('This asset is currently unavailable');
    }

    const walletAccount = await manager
      .getRepository(WalletAccount)
      .findOneBy({ userId });
    if (!walletAccount) throw new NotFoundException('Wallet account not found');

    return walletRepo.save(
      walletRepo.create({
        walletAccountId: walletAccount.id,
        symbol: asset.symbol,
        apiId: asset.apiId,
        isFiat: asset.isFiat,
        fixedRateUsd: asset.fixedRateUsd,
        balance: '0',
      }),
    );
  }

  async transfer(
    userId: string,
    fromSymbol: string,
    toSymbol: string,
    amount: string,
  ) {
    if (fromSymbol === toSymbol)
      throw new BadRequestException('Source and destination must differ');
    const decimalAmount = new Decimal(amount);
    if (decimalAmount.lte(0))
      throw new BadRequestException('Amount must be positive');

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const fromWallet = await walletRepo.findOne({
        where: { symbol: fromSymbol, walletAccount: { userId } },
        relations: { walletAccount: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!fromWallet) throw new NotFoundException('Wallet not found');

      // The destination wallet may not have a row yet if this is the first
      // time the user moves funds into that asset.
      const toWallet = await this.getOrCreateWallet(userId, toSymbol, manager);

      const fromBalance = new Decimal(fromWallet.balance);
      if (fromBalance.lt(decimalAmount))
        throw new BadRequestException('Insufficient balance');

      const fromRate = this.getUsdRate(fromWallet);
      const toRate = this.getUsdRate(toWallet);
      if (fromRate == null || toRate == null) {
        throw new BadRequestException(
          'Live price unavailable for one of the selected assets, try again shortly',
        );
      }

      const usdValue = decimalAmount.mul(fromRate);
      const creditAmount = usdValue.div(toRate);

      fromWallet.balance = fromBalance.minus(decimalAmount).toFixed(8);
      toWallet.balance = new Decimal(toWallet.balance)
        .plus(creditAmount)
        .toFixed(8);
      await walletRepo.save(fromWallet);
      await walletRepo.save(toWallet);

      const txRepo = manager.getRepository(Transaction);
      const outTx = await txRepo.save(
        txRepo.create({
          userId,
          walletId: fromWallet.id,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          type: TransactionType.TRANSFER_OUT,
          status: TransactionStatus.COMPLETED,
          amount: decimalAmount.toFixed(8),
          currencySymbol: fromSymbol,
          usdEquivalent: usdValue.toFixed(2),
          confirmedAt: new Date(),
        }),
      );
      await txRepo.save(
        txRepo.create({
          userId,
          walletId: toWallet.id,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          type: TransactionType.TRANSFER_IN,
          status: TransactionStatus.COMPLETED,
          amount: creditAmount.toFixed(8),
          currencySymbol: toSymbol,
          usdEquivalent: usdValue.toFixed(2),
          confirmedAt: new Date(),
        }),
      );

      return { fromWallet, toWallet, transaction: outTx };
    });
  }

  async requestDeposit(
    userId: string,
    symbol: string,
    amount: string,
    txHash?: string,
  ) {
    const wallet = await this.getOrCreateWallet(userId, symbol);
    const decimalAmount = new Decimal(amount);
    if (decimalAmount.lte(0))
      throw new BadRequestException('Amount must be positive');

    const minDepositUsd = await this.settingsService.getValue(
      'min_deposit_usd',
      10,
    );
    const rate = this.getUsdRate(wallet);
    const usdValue = rate != null ? decimalAmount.mul(rate) : null;
    if (usdValue != null && usdValue.lt(minDepositUsd)) {
      throw new BadRequestException(`Minimum deposit is $${minDepositUsd}`);
    }

    // Snapshot the address that's current right now, so a later admin edit
    // never rewrites the payment instructions for a deposit already in flight.
    const depositAddress = await this.getResolvedDepositAddress(userId, symbol);

    const txRepo = this.dataSource.getRepository(Transaction);
    return txRepo.save(
      txRepo.create({
        userId,
        walletId: wallet.id,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        amount: decimalAmount.toFixed(8),
        currencySymbol: symbol,
        usdEquivalent: usdValue?.toFixed(2) ?? null,
        destinationAddress: depositAddress,
        txHash: txHash ?? null,
      }),
    );
  }

  async requestWithdrawal(
    userId: string,
    symbol: string,
    amount: string,
    destinationAddress: string,
  ) {
    const decimalAmount = new Decimal(amount);
    if (decimalAmount.lte(0))
      throw new BadRequestException('Amount must be positive');

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const wallet = await walletRepo.findOne({
        where: { symbol, walletAccount: { userId } },
        relations: { walletAccount: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new NotFoundException(`Wallet ${symbol} not found`);

      const balance = new Decimal(wallet.balance);
      if (balance.lt(decimalAmount))
        throw new BadRequestException('Insufficient balance');

      const rate = this.getUsdRate(wallet);
      const usdValue = rate != null ? decimalAmount.mul(rate) : null;
      const minWithdrawalUsd = await this.settingsService.getValue(
        'min_withdrawal_usd',
        20,
      );
      if (usdValue != null && usdValue.lt(minWithdrawalUsd)) {
        throw new BadRequestException(
          `Minimum withdrawal is $${minWithdrawalUsd}`,
        );
      }

      // A per-user override (set from the admin user detail page) takes
      // precedence over the platform-wide default when present.
      const user = await manager.getRepository(User).findOneBy({ id: userId });
      const globalMaxWithdrawalUsd = await this.settingsService.getValue(
        'max_withdrawal_usd',
        50000,
      );
      const maxWithdrawalUsd = user?.txLimit?.maxWithdrawal ?? globalMaxWithdrawalUsd;
      if (usdValue != null && usdValue.gt(maxWithdrawalUsd)) {
        throw new BadRequestException(
          `Maximum withdrawal is $${maxWithdrawalUsd}`,
        );
      }

      wallet.balance = balance.minus(decimalAmount).toFixed(8);
      await walletRepo.save(wallet);

      const requiresApproval = await this.settingsService.getValue(
        'withdrawal_requires_admin_approval',
        true,
      );

      const txRepo = manager.getRepository(Transaction);
      return txRepo.save(
        txRepo.create({
          userId,
          walletId: wallet.id,
          type: TransactionType.WITHDRAWAL,
          status: requiresApproval
            ? TransactionStatus.PENDING
            : TransactionStatus.COMPLETED,
          amount: decimalAmount.toFixed(8),
          currencySymbol: symbol,
          usdEquivalent: usdValue?.toFixed(2) ?? null,
          destinationAddress,
          confirmedAt: requiresApproval ? null : new Date(),
        }),
      );
    });
  }

  // Lets an admin credit or debit a user's wallet directly (signed amount:
  // positive credits, negative debits), for corrections or manual top ups
  // that don't go through the normal deposit/withdraw flow. An admin using
  // this to directly enact a deposit or withdrawal on a user's behalf can
  // pass the real type so it posts as DEPOSIT/WITHDRAWAL instead of the
  // generic ADMIN_ADJUSTMENT, immediately COMPLETED either way since the
  // admin is the one enacting it, not queuing another item to approve.
  async adminAdjustBalance(
    adminId: string,
    userId: string,
    symbol: string,
    amount: string,
    note?: string,
    type: TransactionType = TransactionType.ADMIN_ADJUSTMENT,
  ) {
    const decimalAmount = new Decimal(amount);
    if (decimalAmount.eq(0)) {
      throw new BadRequestException('Amount must not be zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const wallet = await this.getOrCreateWallet(userId, symbol, manager);
      const walletRepo = manager.getRepository(Wallet);

      const balance = new Decimal(wallet.balance);
      const newBalance = balance.plus(decimalAmount);
      if (newBalance.lt(0)) {
        throw new BadRequestException(
          'This would take the wallet balance negative',
        );
      }
      wallet.balance = newBalance.toFixed(8);
      await walletRepo.save(wallet);

      const rate = this.getUsdRate(wallet);
      const usdValue = rate != null ? decimalAmount.mul(rate) : null;

      const txRepo = manager.getRepository(Transaction);
      return txRepo.save(
        txRepo.create({
          userId,
          walletId: wallet.id,
          type,
          status: TransactionStatus.COMPLETED,
          amount: decimalAmount.toFixed(8),
          currencySymbol: symbol,
          usdEquivalent: usdValue?.toFixed(2) ?? null,
          adminNote: note ?? (decimalAmount.gt(0) ? 'Manual credit' : 'Manual debit'),
          confirmedByAdminId: adminId,
          confirmedAt: new Date(),
        }),
      );
    });
  }

  // Same wallet-credit + transaction pattern as adminAdjustBalance, but for
  // system-triggered bonuses (registration, upline, downline) that fire at
  // signup, not an admin action, so there's no adminId to attach.
  async creditBonus(
    userId: string,
    amount: Decimal,
    type: TransactionType,
    note: string,
  ) {
    if (amount.lte(0)) return null;

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const wallet = await walletRepo.findOne({
        where: { symbol: 'fiat_usd', walletAccount: { userId } },
        relations: { walletAccount: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) return null;

      wallet.balance = new Decimal(wallet.balance).plus(amount).toFixed(8);
      await walletRepo.save(wallet);

      const txRepo = manager.getRepository(Transaction);
      return txRepo.save(
        txRepo.create({
          userId,
          walletId: wallet.id,
          type,
          status: TransactionStatus.COMPLETED,
          amount: amount.toFixed(8),
          currencySymbol: 'fiat_usd',
          usdEquivalent: amount.toFixed(2),
          adminNote: note,
          confirmedAt: new Date(),
        }),
      );
    });
  }
}
