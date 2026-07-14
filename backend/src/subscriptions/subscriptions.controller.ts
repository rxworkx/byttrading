import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireApproved } from '../common/decorators/require-approved.decorator';
import { PlanTerm } from '../database/entities';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  findMine(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.findForUser(userId);
  }

  @RequireApproved()
  @Post()
  subscribe(@CurrentUser('id') userId: string, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(
      userId,
      dto.planId,
      dto.term as PlanTerm,
      dto.walletSymbol,
    );
  }
}
