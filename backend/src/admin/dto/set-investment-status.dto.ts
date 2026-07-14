import { IsIn } from 'class-validator';
import { InvestmentStatus } from '../../database/entities';

export class SetInvestmentStatusDto {
  @IsIn([
    InvestmentStatus.AWAITING,
    InvestmentStatus.ACTIVE,
    InvestmentStatus.COMPLETED,
    InvestmentStatus.CANCELLED,
  ])
  status: InvestmentStatus;
}
