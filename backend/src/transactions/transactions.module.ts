import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset, Transaction } from '../database/entities';
import { PricesModule } from '../prices/prices.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Asset]), PricesModule],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
