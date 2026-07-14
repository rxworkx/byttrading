import { MigrationInterface, QueryRunner } from 'typeorm';

export class TwoFactorOptInByDefault1783200000000
  implements MigrationInterface
{
  name = 'TwoFactorOptInByDefault1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "twoFactorEnabled" SET DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "twoFactorEnabled" SET DEFAULT true`,
    );
  }
}
