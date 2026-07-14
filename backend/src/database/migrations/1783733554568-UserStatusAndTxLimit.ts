import { MigrationInterface, QueryRunner } from "typeorm";

export class UserStatusAndTxLimit1783733554568 implements MigrationInterface {
    name = 'UserStatusAndTxLimit1783733554568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('AWAITING', 'ACTIVE', 'SUSPENDED', 'DISABLED')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "txLimit" jsonb NOT NULL DEFAULT '{"freeze":false,"maxWithdrawal":null}'`);
        // Backfill from the column being replaced, before it's dropped: an
        // unapproved account becomes AWAITING and frozen, preserving the
        // exact same access it had under the old isApproved gate.
        await queryRunner.query(`UPDATE "users" SET "status" = 'AWAITING' WHERE "isApproved" = false`);
        await queryRunner.query(`UPDATE "users" SET "txLimit" = '{"freeze":true,"maxWithdrawal":null}' WHERE "isApproved" = false`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isApproved"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e095b2a8a6efc50e2934aa3a4"`);
        await queryRunner.query(`ALTER TYPE "public"."investments_status_enum" ADD VALUE 'AWAITING'`);
        await queryRunner.query(`CREATE INDEX "IDX_7e095b2a8a6efc50e2934aa3a4" ON "investments"  ("status", "nextAccrualAt") `);
        // LOCKED was the old name for what the app now calls ACTIVE (a
        // running, accruing trade); AWAITING is the new pre-approval state.
        await queryRunner.query(`UPDATE "investments" SET "status" = 'ACTIVE' WHERE "status" = 'LOCKED'`);
        // REJECTED transactions are now folded into CANCELLED across the app.
        await queryRunner.query(`UPDATE "transactions" SET "status" = 'CANCELLED' WHERE "status" = 'REJECTED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7e095b2a8a6efc50e2934aa3a4"`);
        await queryRunner.query(`CREATE TYPE "public"."investments_status_enum_old" AS ENUM('ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "status" TYPE "public"."investments_status_enum_old" USING "status"::"text"::"public"."investments_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."investments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."investments_status_enum_old" RENAME TO "investments_status_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_7e095b2a8a6efc50e2934aa3a4" ON "investments" USING btree ("nextAccrualAt", "status") `);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "txLimit"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isApproved" boolean NOT NULL DEFAULT true`);
    }

}
