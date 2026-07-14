import { MigrationInterface, QueryRunner } from 'typeorm';

// wallet.name only ever mirrored assets.name as it was at wallet-creation
// time, so a later asset rename never reached already-created wallets (as
// happened when fiat_usd's catalog name changed but old wallet rows kept
// the stale copy). The API now resolves the name live from assets by
// symbol instead, so the column serves no purpose.
export class DropWalletName1783917500000 implements MigrationInterface {
  name = 'DropWalletName1783917500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "name" character varying`,
    );
    await queryRunner.query(`
      UPDATE "wallets" w SET "name" = a."name"
      FROM "assets" a
      WHERE a."symbol" = w."symbol"
    `);
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "name" SET NOT NULL`,
    );
  }
}
