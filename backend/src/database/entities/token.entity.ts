import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TokenType } from './enums';
import { User } from './user.entity';

@Entity('tokens')
@Index(['userId', 'type'])
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: TokenType })
  type: TokenType;

  @Index()
  @Column()
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ nullable: true, type: 'varchar' })
  ipAddress: string | null;

  @Column({ nullable: true, type: 'varchar' })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
