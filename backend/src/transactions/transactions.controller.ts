import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('me')
  findMine(@CurrentUser('id') userId: string) {
    return this.transactionsService.findForUser(userId);
  }

  @Roles(Role.ADMIN)
  @Get('pending')
  findPending() {
    return this.transactionsService.findPending();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.transactionsService.findOneForUser(id, userId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/confirm')
  confirm(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('note') note?: string,
  ) {
    return this.transactionsService.confirm(id, adminId, note);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('note') note?: string,
  ) {
    return this.transactionsService.reject(id, adminId, note);
  }
}
