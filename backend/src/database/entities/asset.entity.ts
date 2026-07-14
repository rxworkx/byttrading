import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'varchar', unique: true })
  apiId: string | null;

  @Column()
  image: string;

  @Column({ default: false })
  isFiat: boolean;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  fixedRateUsd: string | null;

  @Column({ type: 'decimal', precision: 24, scale: 8, nullable: true })
  price: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  priceChange: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  fetchedAt: Date | null;

  // Pauses price refresh, hides this asset from the browsable wallet list,
  // and blocks creating a brand-new wallet for it. Wallets that already hold
  // a balance or transaction history are untouched by this flag.
  @Column({ default: true })
  enabled: boolean;

  // Pure display flag for the browsable (zero-balance) wallet list, distinct
  // from `enabled` so an asset can stay live for existing holders while being
  // decluttered from the picker shown to everyone else.
  @Column({ default: true })
  showInWalletList: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
