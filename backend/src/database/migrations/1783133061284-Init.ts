import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1783133061284 implements MigrationInterface {
  name = 'Init1783133061284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_term_enum" AS ENUM('SIX_MONTHS', 'ONE_YEAR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "planId" uuid NOT NULL, "term" "public"."subscriptions_term_enum" NOT NULL, "feePaidUsd" numeric(18,2) NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fbdba4e2ac694cf8c9cecf4dc8" ON "subscriptions"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7536cba909dd7584a4640cad7d" ON "subscriptions"  ("planId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "investment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "rateRange" character varying NOT NULL, "rateNote" character varying, "pricing" jsonb NOT NULL, "cycleLengthDays" integer NOT NULL, "payFrequencyDays" integer NOT NULL, "description" text, "imageUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2650c0fb74532ab906b125adbb7" UNIQUE ("name"), CONSTRAINT "UQ_83e1d939e609aae65541dc3610a" UNIQUE ("slug"), CONSTRAINT "PK_7a8191913fe406c5b14dd8eb3ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "investment_accruals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "investmentId" uuid NOT NULL, "amount" numeric(24,8) NOT NULL, "appliedRatePercent" numeric(6,3) NOT NULL, "isManual" boolean NOT NULL DEFAULT false, "createdByAdminId" character varying, "accrualDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0f4f35db0885c9aa312d5ed7de1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_593a989b319a1e02d8fbda156a" ON "investment_accruals"  ("investmentId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."investments_status_enum" AS ENUM('ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "investments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "planId" uuid NOT NULL, "subscriptionId" uuid NOT NULL, "principal" numeric(24,8) NOT NULL, "lockedAmount" numeric(24,8) NOT NULL, "profitAccrued" numeric(24,8) NOT NULL DEFAULT '0', "cycleLengthDays" integer NOT NULL, "payFrequencyDays" integer NOT NULL, "status" "public"."investments_status_enum" NOT NULL DEFAULT 'ACTIVE', "startDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "endDate" TIMESTAMP WITH TIME ZONE NOT NULL, "nextAccrualAt" TIMESTAMP WITH TIME ZONE NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE, "cancelledAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a1263853f1a4fb8b849c1c9aff4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1ee4fc01d07959ee6cf7926fe3" ON "investments"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7e095b2a8a6efc50e2934aa3a4" ON "investments"  ("status", "nextAccrualAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'SUBSCRIPTION', 'PROFIT_CREDIT', 'PRINCIPAL_RELEASE', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "walletId" uuid, "fromWalletId" uuid, "toWalletId" uuid, "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING', "amount" numeric(24,8) NOT NULL, "currencySymbol" character varying NOT NULL, "usdEquivalent" numeric(24,2), "txHash" character varying, "destinationAddress" character varying, "relatedInvestmentId" uuid, "adminNote" text, "confirmedByAdminId" character varying, "confirmedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bb58f2b6e30cb51a6504599f4" ON "transactions"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35fc4b83a39ef23f08a4b5ac9c" ON "transactions"  ("type", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "walletAccountId" uuid NOT NULL, "symbol" character varying NOT NULL, "name" character varying NOT NULL, "apiId" character varying, "isFiat" boolean NOT NULL DEFAULT false, "isTradingWallet" boolean NOT NULL DEFAULT false, "fixedRateUsd" numeric(18,8), "depositAddress" character varying, "balance" numeric(24,8) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_89175a9c555c470762ca07511e" ON "wallets"  ("walletAccountId", "symbol") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wallet_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3b42c854013f7c7bfe24a3fdd18" UNIQUE ("userId"), CONSTRAINT "REL_3b42c854013f7c7bfe24a3fdd1" UNIQUE ("userId"), CONSTRAINT "PK_7d29a782bf4203c2ed2b613353d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."kyc_status_enum" AS ENUM('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "kyc" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "status" "public"."kyc_status_enum" NOT NULL DEFAULT 'NOT_SUBMITTED', "documentType" character varying, "documentFrontUrl" character varying, "documentBackUrl" character varying, "selfieUrl" character varying, "rejectionReason" text, "reviewedByAdminId" character varying, "reviewedAt" TIMESTAMP WITH TIME ZONE, "submittedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ca948073ed4a3ba22030d37b3db" UNIQUE ("userId"), CONSTRAINT "REL_ca948073ed4a3ba22030d37b3d" UNIQUE ("userId"), CONSTRAINT "PK_84ab2e81ea9700d29dda719f3be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'TRANSACTION', 'KYC', 'INVESTMENT', 'REFERRAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "body" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5340fc241f57310d243e5ab20b" ON "notifications"  ("userId", "isRead") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_type_enum" AS ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'REFRESH', 'TWO_FACTOR_OTP')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."tokens_type_enum" NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "consumedAt" TIMESTAMP WITH TIME ZONE, "attempts" integer NOT NULL DEFAULT '0', "ipAddress" character varying, "userAgent" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d089468ffba8d8ad3954f9d82d" ON "tokens"  ("tokenHash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea889bd62cc7e8f8c401b4dcd2" ON "tokens"  ("userId", "type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "referrerId" uuid NOT NULL, "referredId" uuid NOT NULL, "bonusUsd" numeric(18,2), "triggerEvent" character varying, "paidAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ad6772c3fcb57375f43114b5cb5" UNIQUE ("referredId"), CONSTRAINT "REL_ad6772c3fcb57375f43114b5cb" UNIQUE ("referredId"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59de462f9ce130da142e3b5a9f" ON "referrals"  ("referrerId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying, "country" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "isEmailVerified" boolean NOT NULL DEFAULT false, "twoFactorEnabled" boolean NOT NULL DEFAULT true, "referralCode" character varying NOT NULL, "referredById" uuid, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b7f8278f4e89249bb75c9a1589" ON "users"  ("referralCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "price_cache" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "apiId" character varying NOT NULL, "usdPrice" numeric(24,8) NOT NULL, "fetchedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_95d298894d5090d4073fb15f2a2" UNIQUE ("apiId"), CONSTRAINT "PK_356421706ececc2e51e48caa348" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."settings_valuetype_enum" AS ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON')`,
    );
    await queryRunner.query(
      `CREATE TABLE "settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" text NOT NULL, "valueType" "public"."settings_valuetype_enum" NOT NULL DEFAULT 'STRING', "description" text, "updatedByAdminId" character varying, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE ("key"), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES "investment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_accruals" ADD CONSTRAINT "FK_593a989b319a1e02d8fbda156ae" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD CONSTRAINT "FK_1ee4fc01d07959ee6cf7926fe3c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD CONSTRAINT "FK_5c2e331f32741d733c352d156d3" FOREIGN KEY ("planId") REFERENCES "investment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD CONSTRAINT "FK_248c0eb10bbc37ecf21888c6bff" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a88f466d39796d3081cf96e1b66" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_4e9fd0fae0b15072b3ba91b3dcd" FOREIGN KEY ("fromWalletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_8ae6618f9e901745e70f8828ec8" FOREIGN KEY ("toWalletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a8c7bbfa27e4b38b65594f4f80e" FOREIGN KEY ("relatedInvestmentId") REFERENCES "investments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_b16504d2a969fa5d81d1fc5a1ef" FOREIGN KEY ("walletAccountId") REFERENCES "wallet_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_accounts" ADD CONSTRAINT "FK_3b42c854013f7c7bfe24a3fdd18" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD CONSTRAINT "FK_ca948073ed4a3ba22030d37b3db" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_59de462f9ce130da142e3b5a9f4" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_59de462f9ce130da142e3b5a9f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_d417e5d35f2434afc4bd48cb4d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP CONSTRAINT "FK_ca948073ed4a3ba22030d37b3db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_accounts" DROP CONSTRAINT "FK_3b42c854013f7c7bfe24a3fdd18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_b16504d2a969fa5d81d1fc5a1ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_a8c7bbfa27e4b38b65594f4f80e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_8ae6618f9e901745e70f8828ec8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_4e9fd0fae0b15072b3ba91b3dcd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_a88f466d39796d3081cf96e1b66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" DROP CONSTRAINT "FK_248c0eb10bbc37ecf21888c6bff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" DROP CONSTRAINT "FK_5c2e331f32741d733c352d156d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" DROP CONSTRAINT "FK_1ee4fc01d07959ee6cf7926fe3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_accruals" DROP CONSTRAINT "FK_593a989b319a1e02d8fbda156ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7536cba909dd7584a4640cad7d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`,
    );
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP TYPE "public"."settings_valuetype_enum"`);
    await queryRunner.query(`DROP TABLE "price_cache"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7f8278f4e89249bb75c9a1589"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_59de462f9ce130da142e3b5a9f"`,
    );
    await queryRunner.query(`DROP TABLE "referrals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ea889bd62cc7e8f8c401b4dcd2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d089468ffba8d8ad3954f9d82d"`,
    );
    await queryRunner.query(`DROP TABLE "tokens"`);
    await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5340fc241f57310d243e5ab20b"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "kyc"`);
    await queryRunner.query(`DROP TYPE "public"."kyc_status_enum"`);
    await queryRunner.query(`DROP TABLE "wallet_accounts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_89175a9c555c470762ca07511e"`,
    );
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_35fc4b83a39ef23f08a4b5ac9c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6bb58f2b6e30cb51a6504599f4"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7e095b2a8a6efc50e2934aa3a4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1ee4fc01d07959ee6cf7926fe3"`,
    );
    await queryRunner.query(`DROP TABLE "investments"`);
    await queryRunner.query(`DROP TYPE "public"."investments_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_593a989b319a1e02d8fbda156a"`,
    );
    await queryRunner.query(`DROP TABLE "investment_accruals"`);
    await queryRunner.query(`DROP TABLE "investment_plans"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7536cba909dd7584a4640cad7d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fbdba4e2ac694cf8c9cecf4dc8"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_term_enum"`);
  }
}
