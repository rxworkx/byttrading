import { MigrationInterface, QueryRunner } from 'typeorm';

// Renames the day-count fields on investment_plans/investments to their new
// plain-English-duration equivalents (cycleLengthDays -> term,
// payFrequencyDays -> payFrequency, minHoldDays -> minTerm), converting
// existing integer-day values to "<n> days" strings so termToSeconds still
// parses them. Also adds payWalletFrequency (both tables), and minTerm +
// profitPaid on investments (investments is empty at migration time, so no
// backfill is needed there beyond a plain default).
export class RenamePlanTermFields1783917600000 implements MigrationInterface {
  name = 'RenamePlanTermFields1783917600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "investment_plans" RENAME COLUMN "cycleLengthDays" TO "term"`,
    );
    await queryRunner.query(`
      ALTER TABLE "investment_plans"
      ALTER COLUMN "term" TYPE varchar
      USING (CASE WHEN "term" IS NULL THEN NULL ELSE "term"::text || ' days' END)
    `);

    await queryRunner.query(
      `ALTER TABLE "investment_plans" RENAME COLUMN "payFrequencyDays" TO "payFrequency"`,
    );
    await queryRunner.query(`
      ALTER TABLE "investment_plans"
      ALTER COLUMN "payFrequency" TYPE varchar
      USING ("payFrequency"::text || ' days')
    `);

    await queryRunner.query(
      `ALTER TABLE "investment_plans" RENAME COLUMN "minHoldDays" TO "minTerm"`,
    );
    await queryRunner.query(`
      ALTER TABLE "investment_plans"
      ALTER COLUMN "minTerm" TYPE varchar
      USING ("minTerm"::text || ' days')
    `);
    await queryRunner.query(
      `ALTER TABLE "investment_plans" ALTER COLUMN "minTerm" SET DEFAULT '0 days'`,
    );

    await queryRunner.query(
      `ALTER TABLE "investment_plans" ADD "payWalletFrequency" varchar`,
    );

    await queryRunner.query(
      `ALTER TABLE "investments" RENAME COLUMN "cycleLengthDays" TO "term"`,
    );
    await queryRunner.query(`
      ALTER TABLE "investments"
      ALTER COLUMN "term" TYPE varchar
      USING (CASE WHEN "term" IS NULL THEN NULL ELSE "term"::text || ' days' END)
    `);

    await queryRunner.query(
      `ALTER TABLE "investments" RENAME COLUMN "payFrequencyDays" TO "payFrequency"`,
    );
    await queryRunner.query(`
      ALTER TABLE "investments"
      ALTER COLUMN "payFrequency" TYPE varchar
      USING ("payFrequency"::text || ' days')
    `);

    await queryRunner.query(
      `ALTER TABLE "investments" ADD "minTerm" varchar NOT NULL DEFAULT '0 days'`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD "payWalletFrequency" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" ADD "profitPaid" numeric(24,8) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "investments" DROP COLUMN "profitPaid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investments" DROP COLUMN "payWalletFrequency"`,
    );
    await queryRunner.query(`ALTER TABLE "investments" DROP COLUMN "minTerm"`);

    await queryRunner.query(`
      ALTER TABLE "investments"
      ALTER COLUMN "payFrequency" TYPE int
      USING COALESCE(NULLIF(regexp_replace("payFrequency", '\\D', '', 'g'), '')::int, 1)
    `);
    await queryRunner.query(
      `ALTER TABLE "investments" RENAME COLUMN "payFrequency" TO "payFrequencyDays"`,
    );

    await queryRunner.query(`
      ALTER TABLE "investments"
      ALTER COLUMN "term" TYPE int
      USING (CASE WHEN "term" IS NULL THEN NULL ELSE NULLIF(regexp_replace("term", '\\D', '', 'g'), '')::int END)
    `);
    await queryRunner.query(
      `ALTER TABLE "investments" RENAME COLUMN "term" TO "cycleLengthDays"`,
    );

    await queryRunner.query(
      `ALTER TABLE "investment_plans" DROP COLUMN "payWalletFrequency"`,
    );

    await queryRunner.query(`
      ALTER TABLE "investment_plans"
      ALTER COLUMN "minTerm" TYPE int
      USING COALESCE(NULLIF(regexp_replace("minTerm", '\\D', '', 'g'), '')::int, 0)
    `);
    await queryRunner.query(
      `ALTER TABLE "investment_plans" ALTER COLUMN "minTerm" SET DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "investment_plans" RENAME COLUMN "minTerm" TO "minHoldDays"`,
    );

    await queryRunner.query(`
      ALTER TABLE "investment_plans"
      ALTER COLUMN "payFrequency" TYPE int
      USING COALESCE(NULLIF(regexp_replace("payFrequency", '\\D', '', 'g'), '')::int, 1)
    `);
    await queryRunner.query(
      `ALTER TABLE "investment_plans" RENAME COLUMN "payFrequency" TO "payFrequencyDays"`,
    );

    await queryRunner.query(`
      ALTER TABLE "investment_plans"
      ALTER COLUMN "term" TYPE int
      USING (CASE WHEN "term" IS NULL THEN NULL ELSE NULLIF(regexp_replace("term", '\\D', '', 'g'), '')::int END)
    `);
    await queryRunner.query(
      `ALTER TABLE "investment_plans" RENAME COLUMN "term" TO "cycleLengthDays"`,
    );
  }
}
