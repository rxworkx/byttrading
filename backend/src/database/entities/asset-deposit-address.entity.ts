import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('asset_deposit_addresses')
export class AssetDepositAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  symbol: string;

  @Column({ nullable: true, type: 'varchar' })
  address: string | null;

  @Column({ nullable: true, type: 'varchar' })
  updatedByAdminId: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
