import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_asset_deposit_addresses')
@Index(['userId', 'symbol'], { unique: true })
export class UserAssetDepositAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  symbol: string;

  @Column({ nullable: true, type: 'varchar' })
  address: string | null;

  @Column({ nullable: true, type: 'varchar' })
  updatedByAdminId: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
