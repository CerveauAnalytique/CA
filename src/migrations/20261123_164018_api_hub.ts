import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_api_listings_status" AS ENUM('pending', 'published', 'rejected');
  CREATE TYPE "public"."enum_api_listings_category" AS ENUM('data', 'ai', 'iot', 'finance', 'commerce', 'communication', 'other');
  CREATE TYPE "public"."enum_api_listings_auth" AS ENUM('none', 'apiKey', 'bearer', 'oauth2');
  CREATE TYPE "public"."enum_api_listings_pricing" AS ENUM('free', 'freemium', 'paid');
  CREATE TABLE "api_listings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"status" "enum_api_listings_status" DEFAULT 'pending',
  	"review_note" varchar,
  	"publisher" varchar,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"summary" varchar NOT NULL,
  	"category" "enum_api_listings_category" DEFAULT 'data' NOT NULL,
  	"base_url" varchar NOT NULL,
  	"docs_url" varchar,
  	"auth" "enum_api_listings_auth" DEFAULT 'apiKey',
  	"pricing" "enum_api_listings_pricing" DEFAULT 'free',
  	"openapi" varchar,
  	"endpoint_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "api_listings_id" integer;
  ALTER TABLE "api_listings" ADD CONSTRAINT "api_listings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "api_listings_owner_idx" ON "api_listings" USING btree ("owner_id");
  CREATE INDEX "api_listings_status_idx" ON "api_listings" USING btree ("status");
  CREATE UNIQUE INDEX "api_listings_slug_idx" ON "api_listings" USING btree ("slug");
  CREATE INDEX "api_listings_updated_at_idx" ON "api_listings" USING btree ("updated_at");
  CREATE INDEX "api_listings_created_at_idx" ON "api_listings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_api_listings_fk" FOREIGN KEY ("api_listings_id") REFERENCES "public"."api_listings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_api_listings_id_idx" ON "payload_locked_documents_rels" USING btree ("api_listings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "api_listings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "api_listings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_api_listings_fk";
  
  DROP INDEX "payload_locked_documents_rels_api_listings_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "api_listings_id";
  DROP TYPE "public"."enum_api_listings_status";
  DROP TYPE "public"."enum_api_listings_category";
  DROP TYPE "public"."enum_api_listings_auth";
  DROP TYPE "public"."enum_api_listings_pricing";`)
}
