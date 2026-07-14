import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetCatalog1783844059935 implements MigrationInterface {
    name = 'AddAssetCatalog1783844059935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The catalog (symbol/name/apiId/image/isFiat/fixedRateUsd, previously
        // a hardcoded array) and the price cache (previously its own table)
        // merge into one DB-backed table so an asset can be enabled/disabled,
        // hidden from the wallet picker, and reordered without a deploy.
        // Rows are populated by the app's self-heal seed step on next boot,
        // not backfilled here, so no data is copied from price_cache.
        await queryRunner.query(`
            CREATE TABLE "assets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "symbol" character varying NOT NULL,
                "name" character varying NOT NULL,
                "apiId" character varying,
                "image" character varying NOT NULL,
                "isFiat" boolean NOT NULL DEFAULT false,
                "fixedRateUsd" numeric(18,8),
                "price" numeric(24,8),
                "priceChange" numeric(10,4),
                "fetchedAt" TIMESTAMP WITH TIME ZONE,
                "enabled" boolean NOT NULL DEFAULT true,
                "showInWalletList" boolean NOT NULL DEFAULT true,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_assets_symbol" UNIQUE ("symbol"),
                CONSTRAINT "UQ_assets_apiId" UNIQUE ("apiId"),
                CONSTRAINT "PK_assets" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`DROP TABLE "price_cache"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "price_cache" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "apiId" character varying NOT NULL,
                "usdPrice" numeric(24,8) NOT NULL,
                "fetchedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_price_cache_apiId" UNIQUE ("apiId"),
                CONSTRAINT "PK_price_cache" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`DROP TABLE "assets"`);
    }

}
