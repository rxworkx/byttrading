import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentPlan } from '../database/entities';
import { termToSeconds } from '../investments/term.util';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(InvestmentPlan)
    private readonly planRepo: Repository<InvestmentPlan>,
  ) {}

  // term is a free-form duration string now, not a sortable column, so the
  // shortest-cycle-first ordering (open-ended plans last, matching the old
  // NULLS LAST behavior) is computed in JS after fetching instead.
  async findAllActive() {
    const plans = await this.planRepo.find({ where: { isActive: true } });
    return plans.sort((a, b) => {
      const aSeconds = a.term == null ? Infinity : termToSeconds(a.term);
      const bSeconds = b.term == null ? Infinity : termToSeconds(b.term);
      return aSeconds - bSeconds;
    });
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
