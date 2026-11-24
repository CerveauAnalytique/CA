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

  // Cerebrum, Phylena's own model (Phylena.chat repo, cerebrum/), on catalogs that already exist.
  // A new, empty catalog gets them from the seed instead (src/utilities/seedCatalog.ts).
  await db.execute(sql`
   INSERT INTO "ai_models" ("name", "slug", "publisher", "published", "summary", "task", "framework", "base_model", "chat_model", "version", "stage", "license", "install_command")
  SELECT 'Cerebrum', 'cerebrum', 'Phylena', true,
    'Phylena''s own model for data and models: gpt-oss with personal memory (mem0) and knowledge from your data (cognee).',
    'data-analysis', 'ollama', 'gpt-oss:20b', 'cerebrum/cerebrum', 'v1.0', 'production', 'Apache-2.0',
    'cd cerebrum && docker compose up -d --build'
  WHERE EXISTS (SELECT 1 FROM "ai_models") AND NOT EXISTS (SELECT 1 FROM "ai_models" WHERE "slug" = 'cerebrum');
  INSERT INTO "ai_models" ("name", "slug", "publisher", "published", "summary", "task", "framework", "base_model", "chat_model", "version", "stage", "license", "install_command")
  SELECT 'Cerebrum Agent', 'cerebrum-agent', 'Phylena', true,
    'Cerebrum as an agent that keeps and edits its own memory about you (after Letta) and searches your data with tools.',
    'text-generation', 'ollama', 'gpt-oss:20b', 'cerebrum/cerebrum-agent', 'v1.0', 'production', 'Apache-2.0',
    'cd cerebrum && docker compose up -d --build'
  WHERE EXISTS (SELECT 1 FROM "ai_models") AND NOT EXISTS (SELECT 1 FROM "ai_models" WHERE "slug" = 'cerebrum-agent');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "ai_models" WHERE "slug" IN ('cerebrum', 'cerebrum-agent');`)
  await db.execute(sql`
   ALTER TABLE "users" DROP CONSTRAINT "users_chat_default_model_id_ai_models_id_fk";
  
  DROP INDEX "users_chat_chat_default_model_idx";
  ALTER TABLE "users" DROP COLUMN "chat_theme";
  ALTER TABLE "users" DROP COLUMN "chat_default_model_id";
  ALTER TABLE "users" DROP COLUMN "chat_reasoning";
  ALTER TABLE "ai_models" DROP COLUMN "chat_model";
  DROP TYPE "public"."enum_users_chat_theme";`)
}
