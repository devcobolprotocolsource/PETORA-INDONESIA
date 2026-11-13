ALTER TABLE "invoices" ADD COLUMN "location_id" uuid;--> statement-breakpoint
UPDATE "invoices" AS invoice
SET "location_id" = appointment."location_id"
FROM "appointments" AS appointment
WHERE invoice."location_id" IS NULL
  AND invoice."appointment_id" = appointment."id"
  AND invoice."practice_id" = appointment."practice_id"
  AND appointment."location_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_location_tenant_fk" FOREIGN KEY ("practice_id","location_id") REFERENCES "public"."locations"("practice_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_location_idx" ON "invoices" USING btree ("practice_id","location_id","deleted_at","created_at");