import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { DataSource, In, Repository } from 'typeorm';
import {
  Asset,
  Transaction,
  TransactionStatus,
  TransactionType,
  Wallet,
} from '../database/entities';
import { MailService } from '../mail/mail.service';
import { PricesService } from '../prices/prices.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly pricesService: PricesService,
  ) {}

  create(data: Partial<Transaction>) {
    return this.transactionRepo.save(this.transactionRepo.create(data));
  }

  // usdEquivalent on the row itself is a permanent snapshot taken at the
  // moment the transaction happened (see every wallets/investments write
  // path), kept for record. User facing reads swap it for what that same
  // token amount is worth right now, so their history and totals track the
  // live market instead of a moment in time price.
  private async withLiveUsdEquivalent<T extends Transaction>(transactions: T[]): Promise<T[]> {
    const symbols = [...new Set(transactions.map((tx) => tx.currencySymbol))];
    if (symbols.length === 0) return transactions;

    const assets = await this.assetRepo.find({ where: { symbol: In(symbols) } });
    const assetBySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));

    return transactions.map((tx) => {
      const asset = assetBySymbol.get(tx.currencySymbol);
      const rate =
        asset?.fixedRateUsd != null
          ? Number(asset.fixedRateUsd)
          : asset?.apiId
            ? this.pricesService.getPrice(asset.apiId)
            : null;
      if (rate == null) return tx;
      return { ...tx, usdEquivalent: new Decimal(tx.amount).mul(rate).toFixed(2) };
    });
  }

  async findForUser(userId: string) {
    const transactions = await this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return this.withLiveUsdEquivalent(transactions);
  }

  async findOneForUser(id: string, userId: string) {
    const tx = await this.transactionRepo.findOne({ where: { id, userId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    const [live] = await this.withLiveUsdEquivalent([tx]);
    return live;
  }

  findPending() {
    return this.transactionRepo.find({
      where: { status: TransactionStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async confirm(id: string, adminId: string, note?: string) {
    const confirmed = await this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const walletRepo = manager.getRepository(Wallet);

      const tx = await txRepo.findOne({ where: { id }, relations: { user: true } });
      if (!tx) throw new NotFoundException('Transaction not found');
      if (tx.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(
          'Only pending transactions can be confirmed',
        );
      }

      // Deposits only credit the wallet once an admin confirms them — the balance was
      // never touched when the (unverified) deposit request was first created.
      if (tx.type === TransactionType.DEPOSIT && tx.walletId) {
        const wallet = await walletRepo.findOneBy({ id: tx.walletId });
        if (wallet) {
          wallet.balance = new Decimal(wallet.balance)
            .plus(tx.amount)
            .toFixed(8);
          await walletRepo.save(wallet);
        }
      }

      tx.status = TransactionStatus.COMPLETED;
      tx.confirmedByAdminId = adminId;
      tx.confirmedAt = new Date();
      if (note) tx.adminNote = note;
      return txRepo.save(tx);
    });

    // Sent after the transaction commits, an SMTP hiccup should never roll
    // back a real balance change.
    if (confirmed.type === TransactionType.DEPOSIT) {
      await this.mailService.sendDepositConfirmedEmail(
        confirmed.user.email,
        confirmed.user.firstName,
        confirmed.amount,
        confirmed.currencySymbol,
        confirmed.usdEquivalent,
      );
    } else if (confirmed.type === TransactionType.WITHDRAWAL) {
      await this.mailService.sendWithdrawalConfirmedEmail(
        confirmed.user.email,
        confirmed.user.firstName,
        confirmed.amount,
        confirmed.currencySymbol,
        confirmed.usdEquivalent,
      );
    }

    return confirmed;
  }

  async reject(id: string, adminId: string, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const walletRepo = manager.getRepository(Wallet);

      const tx = await txRepo.findOneBy({ id });
      if (!tx) throw new NotFoundException('Transaction not found');
      if (tx.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(
          'Only pending transactions can be rejected',
        );
      }

      // Withdrawals debit the wallet immediately on request, so a rejection must refund it.
      if (tx.type === TransactionType.WITHDRAWAL && tx.walletId) {
        const wallet = await walletRepo.findOneBy({ id: tx.walletId });
        if (wallet) {
          wallet.balance = new Decimal(wallet.balance)
            .plus(tx.amount)
            .toFixed(8);
          await walletRepo.save(wallet);
        }
      }

      tx.status = TransactionStatus.CANCELLED;
      tx.confirmedByAdminId = adminId;
      tx.confirmedAt = new Date();
      if (note) tx.adminNote = note;
      return txRepo.save(tx);
    });
  }

  // Hard delete, real and irreversible. Only DEPOSIT/WITHDRAWAL are
  // supported: every other type's wallet effect is entangled with another
  // entity (a transfer's other leg, an investment's lockedAmount), so a
  // one-row reversal here would risk corrupting more than it fixes — those
  // are refused outright rather than guessed at. Mirrors confirm()/reject()
  // above, inverted: whatever balance effect is currently outstanding for
  // this row gets undone before the row itself goes away.
  async remove(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const walletRepo = manager.getRepository(Wallet);

      const tx = await txRepo.findOneBy({ id });
      if (!tx) throw new NotFoundException('Transaction not found');
      if (tx.type !== TransactionType.DEPOSIT && tx.type !== TransactionType.WITHDRAWAL) {
        throw new BadRequestException('Only deposits and withdrawals can be deleted');
      }

      const depositCreditOutstanding =
        tx.type === TransactionType.DEPOSIT && tx.status === TransactionStatus.COMPLETED;
      const withdrawalDebitOutstanding =
        tx.type === TransactionType.WITHDRAWAL &&
        (tx.status === TransactionStatus.PENDING || tx.status === TransactionStatus.COMPLETED);

      if ((depositCreditOutstanding || withdrawalDebitOutstanding) && tx.walletId) {
        const wallet = await walletRepo.findOneBy({ id: tx.walletId });
        if (wallet) {
          const balance = new Decimal(wallet.balance);
          const reversed = depositCreditOutstanding
            ? balance.minus(tx.amount)
            : balance.plus(tx.amount);
          if (reversed.lt(0)) {
            throw new BadRequestException(
              'Cannot delete: reversing this deposit would take the wallet balance negative, the funds have already moved elsewhere',
            );
          }
          wallet.balance = reversed.toFixed(8);
          await walletRepo.save(wallet);
        }
      }

      await txRepo.remove(tx);
    });
  }
}
