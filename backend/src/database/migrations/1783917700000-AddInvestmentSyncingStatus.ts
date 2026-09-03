import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvestmentSyncingStatus1783917700000 implements MigrationInterface {
    name = 'AddInvestmentSyncingStatus1783917700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ending a trade cycle no longer credits the wallet on the spot, it
        // now stops at SYNCING until an admin releases the payout. See
        // InvestmentsService.markSyncing / completeInvestment.
        await queryRunner.query(`ALTER TYPE "public"."investments_status_enum" ADD VALUE 'SYNCING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres can't drop an enum value in place, rebuild the type
        // without it like the LOCKED->ACTIVE migration did, folding any
        // in-flight SYNCING rows back to ACTIVE first.
        await queryRunner.query(`UPDATE "investments" SET "status" = 'ACTIVE' WHERE "status" = 'SYNCING'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e095b2a8a6efc50e2934aa3a4"`);
        await queryRunner.query(`CREATE TYPE "public"."investments_status_enum_old" AS ENUM('AWAITING', 'ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "status" TYPE "public"."investments_status_enum_old" USING "status"::"text"::"public"."investments_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."investments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."investments_status_enum_old" RENAME TO "investments_status_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_7e095b2a8a6efc50e2934aa3a4" ON "investments"  ("status", "nextAccrualAt") `);
    }

}
