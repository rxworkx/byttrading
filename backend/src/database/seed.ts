import 'dotenv/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import type { Repository } from 'typeorm';
import dataSource from './data-source';
import {
  Asset,
  InvestmentPlan,
  Role,
  SettingValueType,
  Setting,
  User,
  WalletAccount,
  Wallet,
} from './entities';
import { ASSET_CATALOG, ensureAssetCatalogSeeded } from './asset-catalog';

const PLANS: Array<
  Pick<
    InvestmentPlan,
    | 'name'
    | 'slug'
    | 'rateRange'
    | 'rateNote'
    | 'pricing'
    | 'term'
    | 'payFrequency'
    | 'payWalletFrequency'
    | 'minTerm'
    | 'description'
    | 'isActive'
  >
> = [
  {
    name: 'AetherGuard',
    slug: 'aether-guard',
    rateRange: '0.25-0.6',
    rateNote: null,
    pricing: { '6mo': 25, '1yr': 40 },
    term: null,
    payFrequency: '1 day',
    payWalletFrequency: null,
    minTerm: '0 days',
    description:
      'Safe & Steady, a conservative, capital preserving trading cycle.',
    isActive: true,
  },
  {
    name: 'QuantumPulse',
    slug: 'quantum-pulse',
    rateRange: '0.8-1.8',
    rateNote: null,
    pricing: { '6mo': 75, '1yr': 100 },
    term: null,
    payFrequency: '1 day',
    payWalletFrequency: null,
    minTerm: '0 days',
    description:
      'Smart & Balanced, a measured mix of growth and risk control.',
    isActive: true,
  },
  {
    name: 'TitanForge',
    slug: 'titan-forge',
    rateRange: '2.0-4.5',
    rateNote: null,
    pricing: { '6mo': 125, '1yr': 175 },
    term: null,
    payFrequency: '1 day',
    payWalletFrequency: null,
    minTerm: '0 days',
    description:
      'Aggressive & High Reward, higher targets for higher risk tolerance.',
    isActive: true,
  },
  {
    name: 'Test Plan (1 min)',
    slug: 'test-plan-1min',
    rateRange: '10-10',
    rateNote: 'Dev/test only, fixed 10% per accrual.',
    pricing: { '6mo': 1, '1yr': 1 },
    term: '5 min',
    payFrequency: '1 min',
    payWalletFrequency: null,
    minTerm: '0 days',
    description:
      'Dev/test plan: pays out every 1 minute and auto completes after 5 '
      + 'minutes. minTerm is 0, so a trade on this plan can still be ended '
      + 'early at any time. Disabled by default, enable from the admin plans page '
      + 'only while testing.',
    isActive: false,
  },
];

const SETTINGS: Array<
  Pick<Setting, 'key' | 'value' | 'valueType' | 'description'>
> = [
  {
    key: 'maintenance_mode',
    value: 'false',
    valueType: SettingValueType.BOOLEAN,
    description: 'Disable public access while true.',
  },
  {
    key: 'kyc_required',
    value: 'false',
    valueType: SettingValueType.BOOLEAN,
    description: 'Require approved KYC before withdrawals.',
  },
  {
    key: 'min_deposit_usd',
    value: '10',
    valueType: SettingValueType.NUMBER,
    description: 'Minimum deposit in USD equivalent.',
  },
  {
    key: 'min_withdrawal_usd',
    value: '20',
    valueType: SettingValueType.NUMBER,
    description: 'Minimum withdrawal in USD equivalent.',
  },
  {
    key: 'withdrawal_requires_admin_approval',
    value: 'true',
    valueType: SettingValueType.BOOLEAN,
    description: 'Gate all withdrawals behind admin approval.',
  },
  {
    key: 'auto_profit_distribution_enabled',
    value: 'true',
    valueType: SettingValueType.BOOLEAN,
    description: 'Let the trade cron auto-accrue profit.',
  },
  {
    key: 'referral_bonus_percent',
    value: '5',
    valueType: SettingValueType.NUMBER,
    description:
      'Referral bonus as % of the referred user’s first subscription fee.',
  },
  {
    key: 'referral_profit_commission_percent',
    value: '10',
    valueType: SettingValueType.NUMBER,
    description:
      'Ongoing referral commission as % of profit on every completed cycle from a referred user, paid to the referrer without reducing the referred user’s payout.',
  },
  {
    key: 'withdrawal_day_of_month',
    value: '15',
    valueType: SettingValueType.NUMBER,
    description:
      'Day of the month withdrawals are scheduled for. Not enforced yet.',
  },
  {
    key: 'support_whatsapp_number',
    value: '',
    valueType: SettingValueType.STRING,
    description: 'WhatsApp support contact number.',
  },
  {
    key: 'support_email',
    value: 'support@byttrading.com',
    valueType: SettingValueType.STRING,
    description: 'Support contact email.',
  },
  {
    key: 'price_cache_ttl_seconds',
    value: '90',
    valueType: SettingValueType.NUMBER,
    description: 'How long cached CoinGecko prices are considered fresh.',
  },
  {
    key: 'site_announcement',
    value: '',
    valueType: SettingValueType.STRING,
    description: 'Optional banner message shown site-wide.',
  },
  {
    key: 'max_withdrawal_usd',
    value: '50000',
    valueType: SettingValueType.NUMBER,
    description: 'Maximum withdrawal in USD equivalent per request.',
  },
  {
    key: 'withdrawal_fee_percent',
    value: '0',
    valueType: SettingValueType.NUMBER,
    description: 'Withdrawal fee as a percentage of the withdrawal amount.',
  },
  {
    key: 'registration_bonus_usd',
    value: '0',
    valueType: SettingValueType.NUMBER,
    description:
      'Flat USD bonus credited to every new signup. Zero disables it.',
  },
  {
    key: 'upline_bonus_usd',
    value: '0',
    valueType: SettingValueType.NUMBER,
    description:
      'Flat USD bonus credited to the referrer when someone signs up with their referral code. Zero disables it.',
  },
  {
    key: 'downline_bonus_usd',
    value: '0',
    valueType: SettingValueType.NUMBER,
    description:
      'Flat USD bonus credited to a new user who signed up with a referral code. Zero disables it.',
  },
  {
    key: 'new_user_default_status',
    value: 'AWAITING',
    valueType: SettingValueType.STRING,
    description:
      'Status assigned to every new signup: AWAITING (needs admin approval before trading) or ACTIVE (usable immediately).',
  },
  {
    key: 'trades_require_approval',
    value: 'false',
    valueType: SettingValueType.BOOLEAN,
    description:
      'When true, newly placed trades start AWAITING admin approval instead of ACTIVE right away.',
  },
];

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

async function provisionWallets(
  walletRepo: Repository<Wallet>,
  walletAccountId: string,
) {
  const existing = await walletRepo.find({ where: { walletAccountId } });
  const existingSymbols = new Set(existing.map((wallet) => wallet.symbol));
  const missing = ASSET_CATALOG.filter(
    (asset) => !existingSymbols.has(asset.symbol),
  );

  if (missing.length > 0) {
    await walletRepo.insert(
      missing.map((asset) => ({
        walletAccountId,
        symbol: asset.symbol,
        apiId: asset.apiId,
        isFiat: asset.isFiat,
        fixedRateUsd: asset.fixedRateUsd,
        balance: '0',
      })),
    );
  }
}

async function main() {
  await dataSource.initialize();

  const assetRepo = dataSource.getRepository(Asset);
  await ensureAssetCatalogSeeded(assetRepo);
  console.log('Seeded asset catalog.');

  const planRepo = dataSource.getRepository(InvestmentPlan);
  for (const plan of PLANS) {
    const existing = await planRepo.findOneBy({ slug: plan.slug });
    if (existing) {
      await planRepo.save(planRepo.merge(existing, plan));
    } else {
      await planRepo.save(planRepo.create(plan));
    }
  }
  console.log(`Seeded ${PLANS.length} investment plans.`);

  const settingRepo = dataSource.getRepository(Setting);
  for (const setting of SETTINGS) {
    const existing = await settingRepo.findOneBy({ key: setting.key });
    if (!existing) {
      await settingRepo.save(settingRepo.create(setting));
    }
  }
  console.log(`Seeded ${SETTINGS.length} settings.`);

  const DEFAULT_ADMIN_USERNAME = 'Jangolina';
  const DEFAULT_ADMIN_PASSWORD = 'Jangolina-999#';

  const userRepo = dataSource.getRepository(User);
  const walletAccountRepo = dataSource.getRepository(WalletAccount);
  const walletRepo = dataSource.getRepository(Wallet);

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  let admin: User | null = null;

  if (adminEmail && adminPassword) {
    admin = await userRepo.findOneBy({ email: adminEmail });
    if (!admin) {
      const passwordHash = await argon2.hash(adminPassword);
      admin = await userRepo.save(
        userRepo.create({
          email: adminEmail,
          passwordHash,
          firstName: 'BYT',
          lastName: 'Admin',
          role: Role.ADMIN,
          isEmailVerified: true,
          referralCode: generateReferralCode(),
        }),
      );
      console.log(`Created admin user ${adminEmail}.`);
    }
    // The simplified admin login needs a username. Backfill it onto this
    // account without touching whatever password is already configured.
    if (!admin.username) {
      admin.username = DEFAULT_ADMIN_USERNAME;
      admin.passwordHash = await argon2.hash(DEFAULT_ADMIN_PASSWORD);
      admin = await userRepo.save(admin);
      console.log(`Set default admin username and password for ${adminEmail}.`);
    }
  } else {
    const existingAdmin = await userRepo.findOneBy({ role: Role.ADMIN });
    if (existingAdmin) {
      admin = existingAdmin;
    } else {
      const passwordHash = await argon2.hash(DEFAULT_ADMIN_PASSWORD);
      admin = await userRepo.save(
        userRepo.create({
          email: 'jangolina@byttrading.local',
          username: DEFAULT_ADMIN_USERNAME,
          passwordHash,
          firstName: 'BYT',
          lastName: 'Admin',
          role: Role.ADMIN,
          isEmailVerified: true,
          referralCode: generateReferralCode(),
        }),
      );
      console.log(`Created default admin user ${DEFAULT_ADMIN_USERNAME}.`);
    }
  }

  if (admin) {
    let walletAccount = await walletAccountRepo.findOneBy({ userId: admin.id });
    if (!walletAccount) {
      walletAccount = await walletAccountRepo.save(
        walletAccountRepo.create({ userId: admin.id }),
      );
    }
    await provisionWallets(walletRepo, walletAccount.id);
    console.log('Admin wallet account provisioned.');
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
