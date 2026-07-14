import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { Investment } from './investment.entity';

export type PlanPricing = Partial<Record<'6mo' | '1yr', number>>;

@Entity('investment_plans')
export class InvestmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  rateRange: string;

  @Column({ nullable: true, type: 'varchar' })
  rateNote: string | null;

  @Column({ type: 'jsonb' })
  pricing: PlanPricing;

  // Free-form duration strings ("5 days", "1 day", "5 min", "daily"), parsed
  // by termToSeconds/termToMs in investments/term.util.ts. Null term means
  // no fixed cycle: the investor ends the trade whenever they choose
  // instead of it auto-completing on a schedule.
  @Column({ type: 'varchar', nullable: true })
  term: string | null;

  @Column({ type: 'varchar' })
  payFrequency: string;

  // How often accrued profit is actually paid out to the wallet, separate
  // from payFrequency (how often profit is calculated and added to the
  // running total). Not consumed anywhere yet, profit is only ever paid out
  // in full when the trade completes or is cancelled, this just reserves
  // the field for a future periodic-payout feature.
  @Column({ type: 'varchar', nullable: true })
  payWalletFrequency: string | null;

  // Minimum duration that must pass before an investor can end a
  // no-fixed-cycle trade early. Defaults to "0 days" (no restriction, can
  // end anytime).
  @Column({ type: 'varchar', default: '0 days' })
  minTerm: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'varchar' })
  imageUrl: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  @OneToMany(() => Investment, (investment) => investment.plan)
  investments: Investment[];
}
