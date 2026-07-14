import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlanTerm, SubscriptionStatus } from './enums';
import { User } from './user.entity';
import { InvestmentPlan } from './investment-plan.entity';
import { Investment } from './investment.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  planId: string;

  @ManyToOne(() => InvestmentPlan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: InvestmentPlan;

  @Column({ type: 'enum', enum: PlanTerm })
  term: PlanTerm;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  feePaidUsd: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Investment, (investment) => investment.subscription)
  investments: Investment[];
}
