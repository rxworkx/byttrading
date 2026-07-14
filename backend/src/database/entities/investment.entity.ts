import {
  BeforeInsert,
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
import { InvestmentStatus } from './enums';
import { User } from './user.entity';
import { InvestmentPlan } from './investment-plan.entity';
import { Subscription } from './subscription.entity';
import { Transaction } from './transaction.entity';

// One entry per accrual event (scheduled or manual), newest last. Kept as
// JSON on the investment row instead of a separate table since it's never
// queried standalone outside of this investment.
export interface InvestmentAccrualRecord {
  amount: string;
  appliedRatePercent: string;
  isManual: boolean;
  createdByAdminId: string | null;
  accrualDate: string;
}

@Entity('investments')
@Index(['status', 'nextAccrualAt'])
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  reference: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.investments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  planId: string;

  @ManyToOne(() => InvestmentPlan, (plan) => plan.investments)
  @JoinColumn({ name: 'planId' })
  plan: InvestmentPlan;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.investments)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  // Which wallet the principal was debited from, and where it (plus any
  // profit) is credited back on completion or cancellation.
  @Column()
  walletSymbol: string;

  @Column({ type: 'decimal', precision: 24, scale: 8 })
  principal: string;

  @Column({ type: 'decimal', precision: 24, scale: 8 })
  lockedAmount: string;

  @Column({ type: 'decimal', precision: 24, scale: 8, default: 0 })
  profitAccrued: string;

  // How much of profitAccrued has actually been paid out to the wallet so
  // far (vs just added to the running total). Currently only ever jumps to
  // match profitAccrued in one shot when the trade completes, since payout
  // is all-at-once, not periodic yet, see payWalletFrequency below.
  @Column({ type: 'decimal', precision: 24, scale: 8, default: 0 })
  profitPaid: string;

  // Snapshotted from the plan at start time (see investments.service.ts
  // start()), not read live off the plan, so an admin editing the plan
  // later never changes the terms of a trade already in progress.
  @Column({ type: 'varchar', nullable: true })
  term: string | null;

  @Column({ type: 'varchar' })
  payFrequency: string;

  // Reserved for a future periodic-payout feature, see the same field on
  // InvestmentPlan. Not consumed yet.
  @Column({ type: 'varchar', nullable: true })
  payWalletFrequency: string | null;

  @Column({ type: 'varchar', default: '0 days' })
  minTerm: string;

  @Column({
    type: 'enum',
    enum: InvestmentStatus,
    default: InvestmentStatus.ACTIVE,
  })
  status: InvestmentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  startDate: Date;

  // Null when the plan has no fixed cycle: the investor ends the trade
  // themselves instead of it auto-completing via the cron sweep.
  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'timestamptz' })
  nextAccrualAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  accruals: InvestmentAccrualRecord[];

  @OneToMany(() => Transaction, (transaction) => transaction.investment)
  transactions: Transaction[];

  @BeforeInsert()
  generateReference() {
    if (!this.reference) {
      const stamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).slice(2, 6).toUpperCase();
      this.reference = `INV${stamp}${random}`;
    }
  }
}
