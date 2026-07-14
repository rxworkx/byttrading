import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../database/entities';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  async publicSettings() {
    const all = await this.settingsService.findAll();
    const publicKeys = [
      'support_whatsapp_number',
      'support_email',
      'site_announcement',
      'maintenance_mode',
      'referral_bonus_percent',
      'referral_profit_commission_percent',
      'min_deposit_usd',
      'min_withdrawal_usd',
      'withdrawal_day_of_month',
    ];
    return all.filter((s) => publicKeys.includes(s.key));
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Roles(Role.ADMIN)
  @Post(':key')
  setValue(
    @Param('key') key: string,
    @Body('value') value: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.settingsService.setValue(key, value, adminId);
  }
}
