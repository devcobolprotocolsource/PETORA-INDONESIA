ALTER TABLE "staff_role_assignments" DROP CONSTRAINT "staff_role_assignments_role_tenant_fk";
--> statement-breakpoint
ALTER TABLE "staff_role_assignments" ADD CONSTRAINT "staff_role_assignments_role_tenant_fk" FOREIGN KEY ("practice_id","role_id") REFERENCES "public"."staff_roles"("practice_id","id") ON DELETE no action ON UPDATE no action;