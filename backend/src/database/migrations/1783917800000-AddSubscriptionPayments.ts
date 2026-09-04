import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionPayments1783917800000 implements MigrationInterface {
    name = 'AddSubscriptionPayments1783917800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // A per-token switch for whether its shared company deposit address
        // can be paid into for subscriptions, independent of `enabled` /
        // `showInWalletList` (see Asset entity comment).
        await queryRunner.query(`ALTER TABLE "assets" ADD "paymentsEnabled" boolean NOT NULL DEFAULT false`);

        // Subscriptions now start out PENDING (fee quoted, payment not yet
        // confirmed) instead of jumping straight to ACTIVE.
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum" ADD VALUE 'PENDING' BEFORE 'ACTIVE'`);

        // The term window doesn't start until an admin confirms the payment,
        // so a PENDING subscription has no expiry yet.
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "expiresAt" DROP NOT NULL`);

        // Links the PENDING payment transaction a subscription request
        // creates back to that subscription, so confirming/rejecting the
        // transaction can activate or cancel it.
        await queryRunner.query(`ALTER TABLE "transactions" ADD "relatedSubscriptionId" uuid`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_relatedSubscriptionId" FOREIGN KEY ("relatedSubscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_relatedSubscriptionId"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "relatedSubscriptionId"`);

        // Postgres can't drop an enum value in place, so any leftover PENDING
        // rows are folded to CANCELLED (they were never paid) before the type
        // is rebuilt without it.
        await queryRunner.query(`UPDATE "subscriptions" SET "status" = 'CANCELLED' WHERE "status" = 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "expiresAt" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum_old" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum_old" USING "status"::"text"::"public"."subscriptions_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum_old" RENAME TO "subscriptions_status_enum"`);

        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "paymentsEnabled"`);
    }

}
