import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireApproved } from '../common/decorators/require-approved.decorator';
import { User } from '../database/entities';
import { WalletsService } from './wallets.service';
import { TransferDto } from './dto/transfer.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async findMine(@CurrentUser() user: User) {
    const wallets = await this.walletsService.findAllForUserWithValue(user.id);
    if (!user.txLimit?.freeze) return wallets;
    // Frozen accounts can see their balances but not deposit addresses.
    return wallets.map((wallet) => ({ ...wallet, depositAddress: null }));
  }

  @RequireApproved()
  @Post('transfer')
  transfer(@CurrentUser('id') userId: string, @Body() dto: TransferDto) {
    return this.walletsService.transfer(
      userId,
      dto.fromSymbol,
      dto.toSymbol,
      dto.amount,
    );
  }

  @RequireApproved()
  @Post('deposit')
  deposit(@CurrentUser('id') userId: string, @Body() dto: DepositDto) {
    return this.walletsService.requestDeposit(
      userId,
      dto.symbol,
      dto.amount,
      dto.txHash,
    );
  }

  @RequireApproved()
  @Post('withdraw')
  withdraw(@CurrentUser('id') userId: string, @Body() dto: WithdrawDto) {
    return this.walletsService.requestWithdrawal(
      userId,
      dto.symbol,
      dto.amount,
      dto.destinationAddress,
    );
  }
}
