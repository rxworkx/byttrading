import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  async findMine(@CurrentUser('id') userId: string) {
    const referrals = await this.referralsService.findForReferrer(userId);
    return referrals.map((referral) => ({
      id: referral.id,
      bonusUsd: referral.bonusUsd,
      triggerEvent: referral.triggerEvent,
      paidAt: referral.paidAt,
      createdAt: referral.createdAt,
      referred: {
        firstName: referral.referred.firstName,
        lastName: referral.referred.lastName,
        createdAt: referral.referred.createdAt,
      },
    }));
  }
}
