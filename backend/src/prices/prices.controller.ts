import { Controller, Get, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities';
import { PricesService } from './prices.service';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Public()
  @Get()
  getAll() {
    return this.pricesService.getAllCached();
  }

  @Roles(Role.ADMIN)
  @Post('refresh')
  forceRefresh() {
    return this.pricesService.forceRefresh();
  }
}
