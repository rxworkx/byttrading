import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationLog1783917274010 implements MigrationInterface {
    name = 'AddNotificationLog1783917274010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "notification_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sentByAdminId" character varying,
                "userId" character varying,
                "recipientLabel" character varying NOT NULL,
                "recipientCount" integer NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL,
                "title" character varying NOT NULL,
                "body" text NOT NULL,
                "sentEmail" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notification_logs"`);
    }

}
