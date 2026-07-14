import { IsIn } from 'class-validator';
import { TransactionStatus } from '../../database/entities';

export class SetTransactionStatusDto {
  @IsIn([TransactionStatus.PENDING, TransactionStatus.COMPLETED, TransactionStatus.CANCELLED])
  status: TransactionStatus;
}
