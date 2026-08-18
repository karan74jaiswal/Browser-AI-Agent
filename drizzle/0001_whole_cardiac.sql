ALTER TABLE "workflows" ALTER COLUMN "org_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "graph" jsonb;--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "user_id";