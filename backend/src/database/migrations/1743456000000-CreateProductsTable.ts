import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1743456000000 implements MigrationInterface {
  name = 'CreateProductsTable1743456000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "product" CASCADE
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "products" CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(30) NOT NULL,
        "sku" character varying(50),
        "name" character varying(150) NOT NULL,
        "purchase_price" decimal(12,2) NOT NULL,
        "sale_price" decimal(12,2) NOT NULL,
        "mrp" decimal(12,2),
        "company_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "unit_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"),
        CONSTRAINT "products_code_unique" UNIQUE ("code"),
        CONSTRAINT "products_sku_unique" UNIQUE ("sku"),
        CONSTRAINT "FK_products_company_id_companies_id"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_products_category_id_categories_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_products_unit_id_units_id"
          FOREIGN KEY ("unit_id") REFERENCES "units"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "products_name_idx" ON "products" ("name")
    `);
    await queryRunner.query(`
      CREATE INDEX "products_is_active_idx" ON "products" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX "products_company_id_idx" ON "products" ("company_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "products_category_id_idx" ON "products" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "products_unit_id_idx" ON "products" ("unit_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "products_company_category_idx"
      ON "products" ("company_id", "category_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."products_company_category_idx"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."products_unit_id_idx"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."products_category_id_idx"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."products_company_id_idx"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."products_is_active_idx"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."products_name_idx"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "products"
    `);
  }
}
