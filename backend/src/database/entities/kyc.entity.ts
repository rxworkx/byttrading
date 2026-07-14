import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KycStatus } from './enums';
import { User } from './user.entity';

@Entity('kyc')
export class Kyc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.kyc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_SUBMITTED })
  status: KycStatus;

  @Column({ nullable: true, type: 'varchar' })
  documentType: string | null;

  @Column({ nullable: true, type: 'varchar' })
  documentFrontUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  documentBackUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  selfieUrl: string | null;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string | null;

  @Column({ nullable: true, type: 'varchar' })
  reviewedByAdminId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
