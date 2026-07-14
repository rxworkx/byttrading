import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireApproved } from '../common/decorators/require-approved.decorator';
import { Role } from '../database/entities';
import { InvestmentsService } from './investments.service';
import { StartInvestmentDto } from './dto/start-investment.dto';
import { ManualAccrualDto } from './dto/manual-accrual.dto';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('me')
  findMine(@CurrentUser('id') userId: string) {
    return this.investmentsService.findForUser(userId);
  }

  @RequireApproved()
  @Post()
  start(@CurrentUser('id') userId: string, @Body() dto: StartInvestmentDto) {
    return this.investmentsService.start(userId, dto.planId, dto.principal, dto.walletSymbol);
  }

  @Post(':id/end')
  endEarly(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.investmentsService.endEarly(userId, id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/accrue')
  manualAccrual(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ManualAccrualDto,
  ) {
    return this.investmentsService.manualAccrual(id, adminId, dto);
  }
}
