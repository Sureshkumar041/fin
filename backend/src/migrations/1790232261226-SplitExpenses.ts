import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitExpenses1790232261226 implements MigrationInterface {
    name = 'SplitExpenses1790232261226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "pk_contacts" PRIMARY KEY ("id"))`);
        // Hand-written: TypeORM can't generate expression indexes (the entity marks it synchronize: false).
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_contacts_user_name" ON "contacts" ("user_id", LOWER("name"))`);
        await queryRunner.query(`CREATE TABLE "expense_participants" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "expense_id" uuid NOT NULL, "contact_id" uuid NOT NULL, "share_amount" numeric(12,2) NOT NULL, "percentage" numeric(5,2), "status" character varying(10) NOT NULL DEFAULT 'PENDING', "settled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_expense_participants_expense_contact" UNIQUE ("expense_id", "contact_id"), CONSTRAINT "chk_expense_participants_settled_at" CHECK (("status" = 'PAID') = ("settled_at" IS NOT NULL)), CONSTRAINT "chk_expense_participants_status" CHECK ("status" IN ('PENDING', 'PAID')), CONSTRAINT "chk_expense_participants_percentage" CHECK ("percentage" IS NULL OR ("percentage" > 0 AND "percentage" <= 100)), CONSTRAINT "chk_expense_participants_share_positive" CHECK ("share_amount" > 0), CONSTRAINT "pk_expense_participants" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_expense_participants_contact_status" ON "expense_participants"  ("contact_id", "status") `);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "split_method" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "chk_expenses_split_method" CHECK ("split_method" IN ('EQUAL', 'CUSTOM', 'PERCENTAGE'))`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "fk_contacts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_participants" ADD CONSTRAINT "fk_expense_participants_expense" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_participants" ADD CONSTRAINT "fk_expense_participants_contact" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expense_participants" DROP CONSTRAINT "fk_expense_participants_contact"`);
        await queryRunner.query(`ALTER TABLE "expense_participants" DROP CONSTRAINT "fk_expense_participants_expense"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "fk_contacts_user"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "chk_expenses_split_method"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "split_method"`);
        await queryRunner.query(`DROP INDEX "public"."idx_expense_participants_contact_status"`);
        await queryRunner.query(`DROP TABLE "expense_participants"`);
        await queryRunner.query(`DROP INDEX "public"."uq_contacts_user_name"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
    }

}
