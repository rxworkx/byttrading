import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SettingValueType } from '../database/entities';

function parseValue(setting: Setting): string | number | boolean {
  switch (setting.valueType) {
    case SettingValueType.NUMBER:
      return Number(setting.value);
    case SettingValueType.BOOLEAN:
      return setting.value === 'true';
    case SettingValueType.JSON:
      return JSON.parse(setting.value) as string | number | boolean;
    default:
      return setting.value;
  }
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  findAll() {
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  async getRaw(key: string): Promise<Setting | null> {
    return this.settingRepo.findOneBy({ key });
  }

  async getValue<T extends string | number | boolean = string>(
    key: string,
    fallback: T,
  ): Promise<T> {
    const setting = await this.settingRepo.findOneBy({ key });
    if (!setting) return fallback;
    return parseValue(setting) as T;
  }

  async setValue(key: string, value: string, adminId?: string) {
    const setting = await this.settingRepo.findOneBy({ key });
    if (!setting) return null;
    setting.value = value;
    setting.updatedByAdminId = adminId ?? null;
    return this.settingRepo.save(setting);
  }
}
