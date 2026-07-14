import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsername1783715842906 implements MigrationInterface {
    name = 'AddUsername1783715842906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users"  ("username") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }

}
