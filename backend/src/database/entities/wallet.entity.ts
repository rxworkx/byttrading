import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WalletAccount } from './wallet-account.entity';
import { Transaction } from './transaction.entity';

@Entity('wallets')
@Index(['walletAccountId', 'symbol'], { unique: true })
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletAccountId: string;

  @ManyToOne(() => WalletAccount, (walletAccount) => walletAccount.wallets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'walletAccountId' })
  walletAccount: WalletAccount;

  @Column()
  symbol: string;

  @Column({ nullable: true, type: 'varchar' })
  apiId: string | null;

  @Column({ default: false })
  isFiat: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  fixedRateUsd: string | null;

  @Column({ nullable: true, type: 'varchar' })
  depositAddress: string | null;

  @Column({ type: 'decimal', precision: 24, scale: 8, default: 0 })
  balance: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.fromWallet)
  transfersFrom: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.toWallet)
  transfersTo: Transaction[];
}
