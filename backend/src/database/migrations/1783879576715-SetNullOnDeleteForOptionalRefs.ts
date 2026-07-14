import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNullOnDeleteForOptionalRefs1783879576715 implements MigrationInterface {
    name = 'SetNullOnDeleteForOptionalRefs1783879576715'

    // Both of these are optional, historical cross-references (who referred
    // this signup; which trade a transaction is tied to), not the row's
    // owning relationship. Neither had an onDelete action, so deleting the
    // referenced row would throw a raw FK violation instead of just clearing
    // the reference. Needed so the new admin hard-delete endpoints (user,
    // investment) can actually run without a DB error.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_a8c7bbfa27e4b38b65594f4f80e"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_a8c7bbfa27e4b38b65594f4f80e" FOREIGN KEY ("relatedInvestmentId") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_a8c7bbfa27e4b38b65594f4f80e"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_a8c7bbfa27e4b38b65594f4f80e" FOREIGN KEY ("relatedInvestmentId") REFERENCES "investments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
