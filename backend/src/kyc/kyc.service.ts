import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc, KycStatus } from '../database/entities';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc) private readonly kycRepo: Repository<Kyc>,
  ) {}

  async findForUser(userId: string) {
    let kyc = await this.kycRepo.findOneBy({ userId });
    if (!kyc) {
      kyc = await this.kycRepo.save(this.kycRepo.create({ userId }));
    }
    return kyc;
  }

  async submit(userId: string, dto: SubmitKycDto) {
    const kyc = await this.findForUser(userId);
    if (kyc.status === KycStatus.APPROVED) {
      throw new BadRequestException('KYC already approved');
    }
    Object.assign(kyc, dto, {
      status: KycStatus.PENDING,
      submittedAt: new Date(),
      rejectionReason: null,
    });
    return this.kycRepo.save(kyc);
  }

  findPending() {
    return this.kycRepo.find({
      where: { status: KycStatus.PENDING },
      order: { submittedAt: 'ASC' },
    });
  }

  async approve(id: string, adminId: string) {
    const kyc = await this.kycRepo.findOneBy({ id });
    if (!kyc) throw new NotFoundException('KYC submission not found');
    kyc.status = KycStatus.APPROVED;
    kyc.reviewedByAdminId = adminId;
    kyc.reviewedAt = new Date();
    return this.kycRepo.save(kyc);
  }

  async reject(id: string, adminId: string, reason: string) {
    const kyc = await this.kycRepo.findOneBy({ id });
    if (!kyc) throw new NotFoundException('KYC submission not found');
    kyc.status = KycStatus.REJECTED;
    kyc.reviewedByAdminId = adminId;
    kyc.reviewedAt = new Date();
    kyc.rejectionReason = reason;
    return this.kycRepo.save(kyc);
  }
}
