import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTradingWallet1783807006728 implements MigrationInterface {
    name = 'RemoveTradingWallet1783807006728'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The trading wallet concept is being removed entirely: subscribing
        // and placing a trade now debit whichever wallet the user picks
        // directly. Transactions are truncated (explicitly requested) since
        // they were built around the old trading-wallet-locked model, but
        // investment rows themselves are kept and simply backfilled to
        // fiat_usd (the wallet trading was pegged 1:1 against) so existing
        // trades keep working instead of being deleted.
        await queryRunner.query(`TRUNCATE TABLE "transactions"`);
        await queryRunner.query(`ALTER TABLE "investments" ADD "walletSymbol" character varying`);
        await queryRunner.query(`UPDATE "investments" SET "walletSymbol" = 'fiat_usd' WHERE "walletSymbol" IS NULL`);
        await queryRunner.query(`ALTER TABLE "investments" ALTER COLUMN "walletSymbol" SET NOT NULL`);
        await queryRunner.query(`DELETE FROM "wallets" WHERE "symbol" = 'trading'`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "isTradingWallet"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "investments" DROP COLUMN "walletSymbol"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "isTradingWallet" boolean NOT NULL DEFAULT false`);
    }

}
