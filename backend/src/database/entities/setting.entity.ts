import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SettingValueType } from './enums';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({
    type: 'enum',
    enum: SettingValueType,
    default: SettingValueType.STRING,
  })
  valueType: SettingValueType;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'varchar' })
  updatedByAdminId: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
