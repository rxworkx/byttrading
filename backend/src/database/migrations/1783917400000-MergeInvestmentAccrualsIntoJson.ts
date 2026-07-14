import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeInvestmentAccrualsIntoJson1783917400000
  implements MigrationInterface
{
  name = 'MergeInvestmentAccrualsIntoJson1783917400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "investments" ADD "accruals" jsonb NOT NULL DEFAULT '[]'`,
    );

    // Fold each investment's accrual rows (ordered oldest first) into its
    // new jsonb column before the source table is dropped.
    await queryRunner.query(`
      UPDATE "investments" i
      SET "accruals" = agg.rows
      FROM (
        SELECT "investmentId",
               jsonb_agg(
                 jsonb_build_object(
                   'amount', "amount",
                   'appliedRatePercent', "appliedRatePercent",
                   'isManual', "isManual",
                   'createdByAdminId', "createdByAdminId",
                   'accrualDate', "accrualDate"
                 )
                 ORDER BY "accrualDate" ASC
               ) AS rows
        FROM "investment_accruals"
        GROUP BY "investmentId"
      ) agg
      WHERE agg."investmentId" = i."id"
    `);

    await queryRunner.query(
      `ALTER TABLE "investment_accruals" DROP CONSTRAINT "FK_593a989b319a1e02d8fbda156ae"`,
    );
    await queryRunner.query(`DROP TABLE "investment_accruals"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "investment_accruals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "investmentId" uuid NOT NULL, "amount" numeric(24,8) NOT NULL, "appliedRatePercent" numeric(6,3) NOT NULL, "isManual" boolean NOT NULL DEFAULT false, "createdByAdminId" character varying, "accrualDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0f4f35db0885c9aa312d5ed7de1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_593a989b319a1e02d8fbda156a" ON "investment_accruals"  ("investmentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_accruals" ADD CONSTRAINT "FK_593a989b319a1e02d8fbda156ae" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      INSERT INTO "investment_accruals"
        ("investmentId", "amount", "appliedRatePercent", "isManual", "createdByAdminId", "accrualDate")
      SELECT i."id",
             (elem->>'amount')::numeric,
             (elem->>'appliedRatePercent')::numeric,
             (elem->>'isManual')::boolean,
             elem->>'createdByAdminId',
             (elem->>'accrualDate')::timestamptz
      FROM "investments" i, jsonb_array_elements(i."accruals") elem
    `);

    await queryRunner.query(`ALTER TABLE "investments" DROP COLUMN "accruals"`);
  }
}
