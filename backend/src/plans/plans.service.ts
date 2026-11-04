import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentPlan } from '../database/entities';
import { sortPlans } from './plan-order';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(InvestmentPlan)
    private readonly planRepo: Repository<InvestmentPlan>,
  ) {}

  async findAllActive() {
    return sortPlans(await this.planRepo.find({ where: { isActive: true } }));
  }

  async findBySlug(slug: string) {
    const plan = await this.planRepo.findOneBy({ slug });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async findById(id: string) {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
}
