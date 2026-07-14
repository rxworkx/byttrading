import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvestmentLockTxType1783136100497 implements MigrationInterface {
  name = 'AddInvestmentLockTxType1783136100497';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_35fc4b83a39ef23f08a4b5ac9c"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."transactions_type_enum" ADD VALUE 'INVESTMENT_LOCK'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35fc4b83a39ef23f08a4b5ac9c" ON "transactions"  ("type", "status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_35fc4b83a39ef23f08a4b5ac9c"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum_old" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'SUBSCRIPTION', 'PROFIT_CREDIT', 'PRINCIPAL_RELEASE', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum_old" USING "type"::"text"::"public"."transactions_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transactions_type_enum_old" RENAME TO "transactions_type_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35fc4b83a39ef23f08a4b5ac9c" ON "transactions" USING btree ("status", "type") `,
    );
  }
}
