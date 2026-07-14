import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';

@Entity('wallet_accounts')
export class WalletAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.walletAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Wallet, (wallet) => wallet.walletAccount)
  wallets: Wallet[];
}
