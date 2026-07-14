import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  findAll() {
    return this.plansService.findAllActive();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.plansService.findBySlug(slug);
  }
}
