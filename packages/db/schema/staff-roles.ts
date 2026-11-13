import {
  check,
  foreignKey,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { baseColumns } from "./common";
import { locations, practices } from "./practices";
import { users } from "./users";

export const staffRoleDataScopeEnum = pgEnum("staff_role_data_scope", [
  "practice",
  "assigned_branches",
  "own",
]);

export const staffRoles = pgTable(
  "staff_roles",
  {
    ...baseColumns(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    dataScope: staffRoleDataScopeEnum("data_scope")
      .notNull()
      .default("assigned_branches"),
    maxDiscountPercent: numeric("max_discount_percent", {
      precision: 5,
      scale: 2,
    }),
    maxRefundAmount: numeric("max_refund_amount", {
      precision: 15,
      scale: 0,
    }),
  },
  (table) => ({
    practiceIdUq: uniqueIndex("staff_roles_practice_id_uq").on(
      table.practiceId,
      table.id,
    ),
    activeSlugUq: uniqueIndex("staff_roles_active_slug_uq")
      .on(table.practiceId, table.slug)
      .where(sql`${table.deletedAt} is null`),
    practiceIdx: index("staff_roles_practice_idx").on(
      table.practiceId,
      table.deletedAt,
    ),
    slugCheck: check(
      "staff_roles_slug_check",
      sql`${table.slug} ~ '^[a-z][a-z0-9_]{0,63}$'`,
    ),
    maxDiscountPercentCheck: check(
      "staff_roles_max_discount_percent_check",
      sql`${table.maxDiscountPercent} is null or ${table.maxDiscountPercent} between 0 and 100`,
    ),
    maxRefundAmountCheck: check(
      "staff_roles_max_refund_amount_check",
      sql`${table.maxRefundAmount} is null or ${table.maxRefundAmount} >= 0`,
    ),
  }),
);

export const staffRolePermissions = pgTable(
  "staff_role_permissions",
  {
    ...baseColumns(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id),
    roleId: uuid("role_id").notNull(),
    permissionKey: varchar("permission_key", { length: 100 }).notNull(),
  },
  (table) => ({
    practiceIdUq: uniqueIndex("staff_role_permissions_practice_id_uq").on(
      table.practiceId,
      table.id,
    ),
    activePermissionUq: uniqueIndex("staff_role_permissions_active_uq")
      .on(table.practiceId, table.roleId, table.permissionKey)
      .where(sql`${table.deletedAt} is null`),
    roleIdx: index("staff_role_permissions_role_idx").on(
      table.practiceId,
      table.roleId,
      table.deletedAt,
    ),
    roleTenantFk: foreignKey({
      columns: [table.practiceId, table.roleId],
      foreignColumns: [staffRoles.practiceId, staffRoles.id],
      name: "staff_role_permissions_role_tenant_fk",
    }).onDelete("cascade"),
    permissionKeyCheck: check(
      "staff_role_permissions_key_check",
      sql`${table.permissionKey} ~ '^[a-z][a-z0-9_.-]{0,99}$'`,
    ),
  }),
);

export const staffRoleAssignments = pgTable(
  "staff_role_assignments",
  {
    ...baseColumns(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id),
    userId: uuid("user_id").notNull(),
    roleId: uuid("role_id").notNull(),
    /** NULL means the role applies to the whole practice. */
    locationId: uuid("location_id"),
  },
  (table) => ({
    practiceIdUq: uniqueIndex("staff_role_assignments_practice_id_uq").on(
      table.practiceId,
      table.id,
    ),
    activePracticeRoleUq: uniqueIndex(
      "staff_role_assignments_active_practice_role_uq",
    )
      .on(table.practiceId, table.userId, table.roleId)
      .where(sql`${table.locationId} is null and ${table.deletedAt} is null`),
    activeBranchRoleUq: uniqueIndex(
      "staff_role_assignments_active_branch_role_uq",
    )
      .on(table.practiceId, table.userId, table.roleId, table.locationId)
      .where(sql`${table.locationId} is not null and ${table.deletedAt} is null`),
    userIdx: index("staff_role_assignments_user_idx").on(
      table.practiceId,
      table.userId,
      table.deletedAt,
    ),
    locationIdx: index("staff_role_assignments_location_idx").on(
      table.practiceId,
      table.locationId,
      table.deletedAt,
    ),
    userTenantFk: foreignKey({
      columns: [table.practiceId, table.userId],
      foreignColumns: [users.practiceId, users.id],
      name: "staff_role_assignments_user_tenant_fk",
    }).onDelete("cascade"),
    roleTenantFk: foreignKey({
      columns: [table.practiceId, table.roleId],
      foreignColumns: [staffRoles.practiceId, staffRoles.id],
      name: "staff_role_assignments_role_tenant_fk",
    }),
    locationTenantFk: foreignKey({
      columns: [table.practiceId, table.locationId],
      foreignColumns: [locations.practiceId, locations.id],
      name: "staff_role_assignments_location_tenant_fk",
    }),
  }),
);

export const staffRolesRelations = relations(staffRoles, ({ one, many }) => ({
  practice: one(practices, {
    fields: [staffRoles.practiceId],
    references: [practices.id],
  }),
  permissions: many(staffRolePermissions),
  assignments: many(staffRoleAssignments),
}));

export const staffRolePermissionsRelations = relations(
  staffRolePermissions,
  ({ one }) => ({
    practice: one(practices, {
      fields: [staffRolePermissions.practiceId],
      references: [practices.id],
    }),
    role: one(staffRoles, {
      fields: [staffRolePermissions.roleId],
      references: [staffRoles.id],
    }),
  }),
);

export const staffRoleAssignmentsRelations = relations(
  staffRoleAssignments,
  ({ one }) => ({
    practice: one(practices, {
      fields: [staffRoleAssignments.practiceId],
      references: [practices.id],
    }),
    user: one(users, {
      fields: [staffRoleAssignments.userId],
      references: [users.id],
    }),
    role: one(staffRoles, {
      fields: [staffRoleAssignments.roleId],
      references: [staffRoles.id],
    }),
    location: one(locations, {
      fields: [staffRoleAssignments.locationId],
      references: [locations.id],
    }),
  }),
);
