import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from '../database/entities';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
  ) {}

  findForReferrer(referrerId: string) {
    return this.referralRepo.find({
      where: { referrerId },
      relations: { referred: true },
      order: { createdAt: 'DESC' },
    });
  }
}
