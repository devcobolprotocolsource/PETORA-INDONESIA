CREATE TYPE "public"."staff_role_data_scope" AS ENUM('practice', 'assigned_branches', 'own');--> statement-breakpoint
CREATE TABLE "staff_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"practice_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"location_id" uuid
);
--> statement-breakpoint
CREATE TABLE "staff_role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"practice_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_key" varchar(100) NOT NULL,
	CONSTRAINT "staff_role_permissions_key_check" CHECK ("staff_role_permissions"."permission_key" ~ '^[a-z][a-z0-9_.-]{0,99}$')
);
--> statement-breakpoint
CREATE TABLE "staff_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"practice_id" uuid NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"data_scope" "staff_role_data_scope" DEFAULT 'assigned_branches' NOT NULL,
	"max_discount_percent" numeric(5, 2),
	"max_refund_amount" numeric(15, 0),
	CONSTRAINT "staff_roles_slug_check" CHECK ("staff_roles"."slug" ~ '^[a-z][a-z0-9_]{0,63}$'),
	CONSTRAINT "staff_roles_max_discount_percent_check" CHECK ("staff_roles"."max_discount_percent" is null or "staff_roles"."max_discount_percent" between 0 and 100),
	CONSTRAINT "staff_roles_max_refund_amount_check" CHECK ("staff_roles"."max_refund_amount" is null or "staff_roles"."max_refund_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_user_tenant_fk" FOREIGN KEY ("practice_id","user_id") REFERENCES "public"."users"("practice_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_role_tenant_fk" FOREIGN KEY ("practice_id","role_id") REFERENCES "public"."staff_roles"("practice_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_location_tenant_fk" FOREIGN KEY ("practice_id","location_id") REFERENCES "public"."locations"("practice_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_permissions" ADD CONSTRAINT "staff_role_permissions_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_permissions" ADD CONSTRAINT "staff_role_permissions_role_tenant_fk" FOREIGN KEY ("practice_id","role_id") REFERENCES "public"."staff_roles"("practice_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_roles" ADD CONSTRAINT "staff_roles_practice_id_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_role_assignments_practice_id_uq" ON "staff_role_assignments" USING btree ("practice_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_role_assignments_active_practice_role_uq" ON "staff_role_assignments" USING btree ("practice_id","user_id","role_id") WHERE "staff_role_assignments"."location_id" is null and "staff_role_assignments"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_role_assignments_active_branch_role_uq" ON "staff_role_assignments" USING btree ("practice_id","user_id","role_id","location_id") WHERE "staff_role_assignments"."location_id" is not null and "staff_role_assignments"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "staff_role_assignments_user_idx" ON "staff_role_assignments" USING btree ("practice_id","user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "staff_role_assignments_location_idx" ON "staff_role_assignments" USING btree ("practice_id","location_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_role_permissions_practice_id_uq" ON "staff_role_permissions" USING btree ("practice_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_role_permissions_active_uq" ON "staff_role_permissions" USING btree ("practice_id","role_id","permission_key") WHERE "staff_role_permissions"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "staff_role_permissions_role_idx" ON "staff_role_permissions" USING btree ("practice_id","role_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_roles_practice_id_uq" ON "staff_roles" USING btree ("practice_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_roles_active_slug_uq" ON "staff_roles" USING btree ("practice_id","slug") WHERE "staff_roles"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "staff_roles_practice_idx" ON "staff_roles" USING btree ("practice_id","deleted_at");
--> statement-breakpoint
INSERT INTO "staff_roles" ("practice_id", "slug", "name", "is_system", "data_scope")
SELECT p."id", legacy."slug", legacy."name", true, 'practice'
FROM "practices" AS p
CROSS JOIN (
	VALUES
		('legacy_admin', 'Administrator (legacy)'),
		('legacy_veterinarian', 'Veterinarian (legacy)'),
		('legacy_technician', 'Technician (legacy)'),
		('legacy_front_desk', 'Front Desk (legacy)'),
		('legacy_viewer', 'Viewer (legacy)')
) AS legacy("slug", "name")
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "staff_role_assignments" ("practice_id", "user_id", "role_id")
SELECT u."practice_id", u."id", r."id"
FROM "users" AS u
JOIN "staff_roles" AS r
  ON r."practice_id" = u."practice_id"
 AND r."slug" = 'legacy_' || u."role"::text
WHERE u."deleted_at" IS NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "staff_roles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "staff_roles"
USING (
	coalesce(current_setting('app.rls_bypass', true), '') = 'on'
	OR "practice_id" = nullif(current_setting('app.current_practice_id', true), '')::uuid
)
WITH CHECK (
	coalesce(current_setting('app.rls_bypass', true), '') = 'on'
	OR "practice_id" = nullif(current_setting('app.current_practice_id', true), '')::uuid
);
--> statement-breakpoint
ALTER TABLE "staff_role_permissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "staff_role_permissions"
USING (
	coalesce(current_setting('app.rls_bypass', true), '') = 'on'
	OR "practice_id" = nullif(current_setting('app.current_practice_id', true), '')::uuid
)
WITH CHECK (
	coalesce(current_setting('app.rls_bypass', true), '') = 'on'
	OR "practice_id" = nullif(current_setting('app.current_practice_id', true), '')::uuid
);
--> statement-breakpoint
ALTER TABLE "staff_role_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "staff_role_assignments"
USING (
	coalesce(current_setting('app.rls_bypass', true), '') = 'on'
	OR "practice_id" = nullif(current_setting('app.current_practice_id', true), '')::uuid
)
WITH CHECK (
	coalesce(current_setting('app.rls_bypass', true), '') = 'on'
	OR "practice_id" = nullif(current_setting('app.current_practice_id', true), '')::uuid
);