import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_chat_theme" AS ENUM('system', 'light', 'dark');
  ALTER TABLE "users" ADD COLUMN "chat_theme" "enum_users_chat_theme" DEFAULT 'system';
  ALTER TABLE "users" ADD COLUMN "chat_default_model_id" integer;
  ALTER TABLE "users" ADD COLUMN "chat_reasoning" boolean DEFAULT false;
  ALTER TABLE "ai_models" ADD COLUMN "chat_model" varchar;
  ALTER TABLE "users" ADD CONSTRAINT "users_chat_default_model_id_ai_models_id_fk" FOREIGN KEY ("chat_default_model_id") REFERENCES "public"."ai_models"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_chat_chat_default_model_idx" ON "users" USING btree ("chat_default_model_id");`)

  // The two models from the catalog seed can chat right away (src/utilities/seedCatalog.ts).
  await db.execute(sql`
   UPDATE "ai_models" SET "chat_model" = 'ca7' WHERE "name" = 'CA7' AND "framework" = 'ollama' AND "chat_model" IS NULL;
  UPDATE "ai_models" SET "chat_model" = 'qwen2.5:7b' WHERE "name" = 'Qwen2.5 7B' AND "framework" = 'ollama' AND "chat_model" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP CONSTRAINT "users_chat_default_model_id_ai_models_id_fk";
  
  DROP INDEX "users_chat_chat_default_model_idx";
  ALTER TABLE "users" DROP COLUMN "chat_theme";
  ALTER TABLE "users" DROP COLUMN "chat_default_model_id";
  ALTER TABLE "users" DROP COLUMN "chat_reasoning";
  ALTER TABLE "ai_models" DROP COLUMN "chat_model";
  DROP TYPE "public"."enum_users_chat_theme";`)
}
