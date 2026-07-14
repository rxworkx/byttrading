import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationType } from './enums';

// One row per admin "send notification" action (targeted or broadcast), not
// one row per recipient — that's what Notification already is, and stays
// untouched by this log (deleting a log entry is purely an audit-trail
// cleanup, it never removes anything from a user's own notification bell).
// recipientLabel/recipientCount are snapshotted at send time so the log
// still reads correctly even if the targeted user is later deleted.
@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'varchar' })
  sentByAdminId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  userId: string | null;

  @Column()
  recipientLabel: string;

  @Column({ type: 'int' })
  recipientCount: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  sentEmail: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
