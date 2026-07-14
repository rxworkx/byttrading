import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApprovalReferralAndFlexibleCycles1783698092536 implements MigrationInterface {
    name = 'AddApprovalReferralAndFlexibleCycles1783698092536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_asset_deposit_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "symbol" character varying NOT NULL, "address" character varying, "updatedByAdminId" character varying, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a568371cf7ff9f44b6fd3317e09" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_915ae2d1d595715d42f1a87440" ON "user_asset_deposit_addresses"  ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b76e98e6392cb0d23e2f501e9a" ON "user_asset_deposit_addresses"  ("userId", "symbol") `);
        await queryRunner.query(`ALTER TABLE "investment_plans" ADD "minHoldDays" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isApproved" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "autoWithdrawalEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "investment_plans" ALTER COLUMN "cycleLengthDays" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "cycleLengthDays" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "endDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_asset_deposit_addresses" ADD CONSTRAINT "FK_915ae2d1d595715d42f1a87440e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_asset_deposit_addresses" DROP CONSTRAINT "FK_915ae2d1d595715d42f1a87440e"`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "endDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "cycleLengthDays" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "investment_plans" ALTER COLUMN "cycleLengthDays" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "autoWithdrawalEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isApproved"`);
        await queryRunner.query(`ALTER TABLE "investment_plans" DROP COLUMN "minHoldDays"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b76e98e6392cb0d23e2f501e9a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_915ae2d1d595715d42f1a87440"`);
        await queryRunner.query(`DROP TABLE "user_asset_deposit_addresses"`);
    }

}
