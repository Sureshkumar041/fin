import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790157787764 implements MigrationInterface {
    name = 'InitialSchema1790157787764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "category_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "description" character varying(255), "expense_date" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_expenses_amount_positive" CHECK ("amount" > 0), CONSTRAINT "pk_expenses" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_expenses_category" ON "expenses"  ("category_id") `);
        await queryRunner.query(`CREATE INDEX "idx_expenses_user_date" ON "expenses"  ("user_id", "expense_date") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_users_email" UNIQUE ("email"), CONSTRAINT "pk_users" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_categories_user_name" UNIQUE ("user_id", "name"), CONSTRAINT "pk_categories" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "fk_categories_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "fk_categories_user"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "fk_expenses_category"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "fk_expenses_user"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."idx_expenses_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_expenses_category"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
    }

}
