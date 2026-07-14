import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kyc } from '../database/entities';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc])],
  providers: [KycService],
  controllers: [KycController],
  exports: [KycService],
})
export class KycModule {}
