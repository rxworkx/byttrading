import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('me')
  findMine(@CurrentUser('id') userId: string) {
    return this.kycService.findForUser(userId);
  }

  @Post('submit')
  submit(@CurrentUser('id') userId: string, @Body() dto: SubmitKycDto) {
    return this.kycService.submit(userId, dto);
  }

  @Roles(Role.ADMIN)
  @Get('pending')
  findPending() {
    return this.kycService.findPending();
  }

  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.kycService.approve(id, adminId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.kycService.reject(id, adminId, reason);
  }
}
