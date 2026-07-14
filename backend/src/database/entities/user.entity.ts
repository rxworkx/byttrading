import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role, UserStatus } from './enums';
import { WalletAccount } from './wallet-account.entity';
import { Kyc } from './kyc.entity';
import { Subscription } from './subscription.entity';
import { Investment } from './investment.entity';
import { Transaction } from './transaction.entity';
import { Notification } from './notification.entity';
import { Token } from './token.entity';
import { Referral } from './referral.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  // Only admin accounts have one, used for the simplified admin login. Left
  // null for regular users, who keep logging in with their email.
  @Index({ unique: true })
  @Column({ nullable: true, type: 'varchar' })
  username: string | null;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true, type: 'varchar' })
  phone: string | null;

  @Column({ nullable: true, type: 'varchar' })
  country: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  // Defaults ACTIVE so existing rows and any non-signup code path (seeding,
  // admin-created accounts) stay usable. AuthService.signup() reads the
  // new_user_default_status setting instead of hardcoding this for real
  // signups, so it can be flipped to ACTIVE platform-wide without a deploy.
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  // { freeze: boolean; maxWithdrawal: number | null }. freeze blocks
  // deposits/withdrawals/transfers/subscribing/trading (see ApprovedGuard);
  // it's automatically set true whenever status becomes AWAITING and false
  // when it leaves AWAITING (see AdminService.setUserStatus), but can also
  // be toggled independently by an admin. maxWithdrawal null means "use the
  // platform default max_withdrawal_usd setting".
  @Column({ type: 'jsonb', default: { freeze: false, maxWithdrawal: null } })
  txLimit: { freeze: boolean; maxWithdrawal: number | null };

  @Column({ default: false })
  autoWithdrawalEnabled: boolean;

  @Index({ unique: true })
  @Column()
  referralCode: string;

  @Column({ nullable: true, type: 'varchar' })
  referredById: string | null;

  @ManyToOne(() => User, (user) => user.referrals, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'referredById' })
  referredBy: User | null;

  @OneToMany(() => User, (user) => user.referredBy)
  referrals: User[];

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => WalletAccount, (walletAccount) => walletAccount.user)
  walletAccount: WalletAccount;

  @OneToOne(() => Kyc, (kyc) => kyc.user)
  kyc: Kyc;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Investment, (investment) => investment.user)
  investments: Investment[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Token, (token) => token.user)
  tokens: Token[];

  @OneToMany(() => Referral, (referral) => referral.referrer)
  referralsGiven: Referral[];

  @OneToOne(() => Referral, (referral) => referral.referred)
  referralReceived: Referral;
}
