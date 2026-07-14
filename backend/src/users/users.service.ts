import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.userRepo.findOneBy({ email: email.toLowerCase() });
  }

  findByUsername(username: string) {
    return this.userRepo.findOneBy({ username });
  }

  findById(id: string) {
    return this.userRepo.findOneBy({ id });
  }

  async generateUniqueReferralCode(): Promise<string> {
    for (;;) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.userRepo.findOneBy({ referralCode: code });
      if (!existing) return code;
    }
  }

  create(data: Partial<User>) {
    return this.userRepo.save(this.userRepo.create(data));
  }

  save(user: User) {
    return this.userRepo.save(user);
  }
}
