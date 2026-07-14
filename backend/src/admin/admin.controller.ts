import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities';
import { AdminService } from './admin.service';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';
import { SetUserTxLimitDto } from './dto/set-user-tx-limit.dto';
import { SetUserVerificationDto } from './dto/set-user-verification.dto';
import { SetInvestmentStatusDto } from './dto/set-investment-status.dto';
import { SetTransactionStatusDto } from './dto/set-transaction-status.dto';
import { SetDepositAddressDto } from './dto/set-deposit-address.dto';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/daily')
  getDailyActivity(@Query('days') days?: string) {
    return this.adminService.getDailyActivity(days ? Number(days) : undefined);
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/role')
  setUserRole(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: SetUserRoleDto,
  ) {
    return this.adminService.setUserRole(adminId, id, dto.role);
  }

  @Patch('users/:id/status')
  setUserStatus(@Param('id') id: string, @Body() dto: SetUserStatusDto) {
    return this.adminService.setUserStatus(id, dto.status);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.deleteUser(adminId, id);
  }

  @Patch('users/:id/tx-limit')
  setUserTxLimit(@Param('id') id: string, @Body() dto: SetUserTxLimitDto) {
    return this.adminService.setUserTxLimit(id, dto);
  }

  @Get('users/:id/referrals')
  getUserReferrals(@Param('id') id: string) {
    return this.adminService.getUserReferrals(id);
  }

  @Patch('users/:id/verification')
  setUserVerification(@Param('id') id: string, @Body() dto: SetUserVerificationDto) {
    return this.adminService.setUserVerification(id, dto);
  }

  @Patch('users/:id/profile')
  updateUserProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.adminService.updateUserProfile(id, dto);
  }

  @Get('users/:id/deposit-addresses')
  listUserDepositAddresses(@Param('id') id: string) {
    return this.adminService.listUserDepositAddresses(id);
  }

  @Patch('users/:id/deposit-addresses/:symbol')
  setUserDepositAddress(
    @Param('id') id: string,
    @Param('symbol') symbol: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: SetDepositAddressDto,
  ) {
    return this.adminService.setUserDepositAddress(adminId, id, symbol, dto.address);
  }

  @Get('deposit-addresses')
  listDepositAddresses() {
    return this.adminService.listDepositAddresses();
  }

  @Patch('deposit-addresses/:symbol')
  setDepositAddress(
    @Param('symbol') symbol: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: SetDepositAddressDto,
  ) {
    return this.adminService.setDepositAddress(adminId, symbol, dto.address);
  }

  @Get('assets')
  listAssets() {
    return this.adminService.listAssets();
  }

  @Patch('assets/:symbol')
  updateAsset(@Param('symbol') symbol: string, @Body() dto: UpdateAssetDto) {
    return this.adminService.updateAsset(symbol, dto);
  }

  @Get('investments')
  listInvestments(@Query('status') status?: string, @Query('userId') userId?: string) {
    return this.adminService.listInvestments(status, userId);
  }

  @Get('subscriptions')
  listAllSubscriptions(@Query('userId') userId?: string) {
    return this.adminService.listAllSubscriptions(userId);
  }

  @Post('investments/:id/complete')
  completeInvestment(@Param('id') id: string) {
    return this.adminService.completeInvestment(id);
  }

  @Post('investments/:id/cancel')
  cancelInvestment(@Param('id') id: string) {
    return this.adminService.cancelInvestment(id);
  }

  @Patch('investments/:id/status')
  setInvestmentStatus(@Param('id') id: string, @Body() dto: SetInvestmentStatusDto) {
    return this.adminService.setInvestmentStatus(id, dto.status);
  }

  @Delete('investments/:id')
  deleteInvestment(@Param('id') id: string) {
    return this.adminService.deleteInvestment(id);
  }

  @Post('transactions/manual')
  createManualTransaction(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateManualTransactionDto,
  ) {
    return this.adminService.createManualTransaction(adminId, dto);
  }

  @Get('transactions/all')
  listAllTransactions(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.listAllTransactions(type, status, userId);
  }

  @Patch('transactions/:id/status')
  setTransactionStatus(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: SetTransactionStatusDto,
  ) {
    return this.adminService.setTransactionStatus(id, adminId, dto.status);
  }

  @Delete('transactions/:id')
  deleteTransaction(@Param('id') id: string) {
    return this.adminService.deleteTransaction(id);
  }

  @Post('notifications')
  sendNotification(@CurrentUser('id') adminId: string, @Body() dto: SendNotificationDto) {
    return this.adminService.sendNotification(adminId, dto);
  }

  @Get('notifications/sent')
  listSentNotifications() {
    return this.adminService.listSentNotifications();
  }

  @Delete('notifications/sent/:id')
  deleteSentNotification(@Param('id') id: string) {
    return this.adminService.deleteSentNotification(id);
  }

  @Get('earnings')
  getEarnings(@Query('userId') userId?: string) {
    return this.adminService.getEarnings(userId);
  }

  @Get('plans')
  listAllPlans() {
    return this.adminService.listAllPlans();
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }
}
