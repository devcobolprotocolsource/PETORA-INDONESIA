DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "users" AS u
		JOIN "locations" AS l ON l."id" = u."location_id"
		WHERE u."practice_id" <> l."practice_id"
	) THEN
		RAISE EXCEPTION 'Cannot add users_location_tenant_fk: users contain a location from another practice.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "products" AS p
		JOIN "locations" AS l ON l."id" = p."location_id"
		WHERE p."practice_id" <> l."practice_id"
	) THEN
		RAISE EXCEPTION 'Cannot add products_location_tenant_fk: products contain a location from another practice.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "location_messaging" AS lm
		JOIN "locations" AS l ON l."id" = lm."location_id"
		WHERE lm."practice_id" <> l."practice_id"
	) THEN
		RAISE EXCEPTION 'Cannot add location_messaging_location_tenant_fk: messaging configuration contains a location from another practice.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "sms_suppressions" AS s
		JOIN "locations" AS l ON l."id" = s."location_id"
		WHERE s."practice_id" <> l."practice_id"
	) THEN
		RAISE EXCEPTION 'Cannot add sms_suppressions_location_tenant_fk: suppressions contain a location from another practice.';
	END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_location_tenant_fk" FOREIGN KEY ("practice_id","location_id") REFERENCES "public"."locations"("practice_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_location_tenant_fk" FOREIGN KEY ("practice_id","location_id") REFERENCES "public"."locations"("practice_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_messaging" ADD CONSTRAINT "location_messaging_location_tenant_fk" FOREIGN KEY ("practice_id","location_id") REFERENCES "public"."locations"("practice_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_suppressions" ADD CONSTRAINT "sms_suppressions_location_tenant_fk" FOREIGN KEY ("practice_id","location_id") REFERENCES "public"."locations"("practice_id","id") ON DELETE no action ON UPDATE no action;