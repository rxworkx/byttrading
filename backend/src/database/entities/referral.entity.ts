import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  referrerId: string;

  @ManyToOne(() => User, (user) => user.referralsGiven, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrerId' })
  referrer: User;

  @Column({ unique: true })
  referredId: string;

  @OneToOne(() => User, (user) => user.referralReceived, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referredId' })
  referred: User;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  bonusUsd: string | null;

  @Column({ nullable: true, type: 'varchar' })
  triggerEvent: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
