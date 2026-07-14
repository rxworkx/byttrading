import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionStatus, TransactionType } from './enums';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';
import { Investment } from './investment.entity';

@Entity('transactions')
@Index(['type', 'status'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  reference: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true, type: 'varchar' })
  walletId: string | null;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { nullable: true })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet | null;

  @Column({ nullable: true, type: 'varchar' })
  fromWalletId: string | null;

  @ManyToOne(() => Wallet, (wallet) => wallet.transfersFrom, { nullable: true })
  @JoinColumn({ name: 'fromWalletId' })
  fromWallet: Wallet | null;

  @Column({ nullable: true, type: 'varchar' })
  toWalletId: string | null;

  @ManyToOne(() => Wallet, (wallet) => wallet.transfersTo, { nullable: true })
  @JoinColumn({ name: 'toWalletId' })
  toWallet: Wallet | null;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 24, scale: 8 })
  amount: string;

  @Column()
  currencySymbol: string;

  @Column({ type: 'decimal', precision: 24, scale: 2, nullable: true })
  usdEquivalent: string | null;

  @Column({ nullable: true, type: 'varchar' })
  txHash: string | null;

  @Column({ nullable: true, type: 'varchar' })
  destinationAddress: string | null;

  @Column({ nullable: true, type: 'varchar' })
  relatedInvestmentId: string | null;

  @ManyToOne(() => Investment, (investment) => investment.transactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'relatedInvestmentId' })
  investment: Investment | null;

  @Column({ nullable: true, type: 'text' })
  adminNote: string | null;

  @Column({ nullable: true, type: 'varchar' })
  confirmedByAdminId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  generateReference() {
    if (!this.reference) {
      const stamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).slice(2, 6).toUpperCase();
      this.reference = `TXN${stamp}${random}`;
    }
  }
}
