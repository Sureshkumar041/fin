import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpenseCategoryDateIndex1790161418212 implements MigrationInterface {
    name = 'ExpenseCategoryDateIndex1790161418212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_expenses_category"`);
        await queryRunner.query(`CREATE INDEX "idx_expenses_category_date" ON "expenses"  ("category_id", "expense_date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_expenses_category_date"`);
        await queryRunner.query(`CREATE INDEX "idx_expenses_category" ON "expenses" USING btree ("category_id") `);
    }

}
