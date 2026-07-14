import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferenceAndDepositAddresses1783594430828 implements MigrationInterface {
    name = 'AddReferenceAndDepositAddresses1783594430828'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "asset_deposit_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "symbol" character varying NOT NULL, "address" character varying, "updatedByAdminId" character varying, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6ed33985910326d56ddd74f90d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e89203376959c2c9cd55dfc066" ON "asset_deposit_addresses"  ("symbol") `);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "reference" character varying`);
        // Backfill existing rows from their own id (already unique) before the
        // column can be made NOT NULL, since new rows generate this via the
        // entity's @BeforeInsert hook but existing rows predate that.
        await queryRunner.query(`UPDATE "transactions" SET "reference" = 'TXN' || upper(substr(replace(id::text, '-', ''), 1, 12)) WHERE "reference" IS NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "reference" SET NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dd85cc865e0c3d5d4be095d3f3" ON "transactions"  ("reference") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_dd85cc865e0c3d5d4be095d3f3"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "reference"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e89203376959c2c9cd55dfc066"`);
        await queryRunner.query(`DROP TABLE "asset_deposit_addresses"`);
    }

}
