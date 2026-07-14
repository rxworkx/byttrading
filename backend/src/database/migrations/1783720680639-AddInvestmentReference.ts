import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvestmentReference1783720680639 implements MigrationInterface {
    name = 'AddInvestmentReference1783720680639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "investments" ADD "reference" character varying`);
        // Backfill existing rows from their own id (already unique) before the
        // column can be made NOT NULL, since new rows generate this via the
        // entity's @BeforeInsert hook but existing rows predate that.
        await queryRunner.query(`UPDATE "investments" SET "reference" = 'INV' || upper(substr(replace(id::text, '-', ''), 1, 12)) WHERE "reference" IS NULL`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "reference" SET NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_afd1aa53f653fa76483238050f" ON "investments"  ("reference") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_afd1aa53f653fa76483238050f"`);
        await queryRunner.query(`ALTER TABLE "investments" DROP COLUMN "reference"`);
    }

}
