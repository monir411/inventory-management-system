import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmailAndSeedAdmin1743464000000
  implements MigrationInterface
{
  name = 'AddUserEmailAndSeedAdmin1743464000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "email" character varying(120)
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "email" = CASE
        WHEN POSITION('@' IN "username") > 0 THEN LOWER("username")
        ELSE LOWER("username") || '@local.invalid'
      END
      WHERE "email" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "email" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique"
      ON "users" ("email")
    `);
    await queryRunner.query(`
      INSERT INTO "users" (
        "username",
        "email",
        "password_hash",
        "role_id",
        "is_active"
      )
      SELECT
        'admin',
        'admin@gmail.com',
        '$2a$12$2QnSqi5qSwNo.s4RpaaGaexVcBtgJLBdoO2djsKxHiRG.GgXk7ywK',
        "id",
        true
      FROM "roles"
      WHERE "name" = 'admin'
        AND NOT EXISTS (
          SELECT 1
          FROM "users"
          WHERE LOWER("email") = 'admin@gmail.com'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "users"
      WHERE LOWER("email") = 'admin@gmail.com'
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "users_email_unique"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "email"
    `);
  }
}
