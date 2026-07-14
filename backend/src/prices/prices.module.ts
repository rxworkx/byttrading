import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '../database/entities';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Asset])],
  providers: [PricesService],
  controllers: [PricesController],
  exports: [PricesService],
})
export class PricesModule {}
