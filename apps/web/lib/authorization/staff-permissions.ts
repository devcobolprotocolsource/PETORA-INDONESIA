import { and, eq, isNull } from "drizzle-orm";
import {
  locations,
  staffRoleAssignments,
  staffRolePermissions,
  staffRoles,
} from "@openpims/db";
import type { Database } from "@openpims/db/client";

export const STAFF_PERMISSION_KEYS = [
  "settings.manage",
  "staff.roles.manage",
  "controlled_substances.manage",
  "appointments.schedule.manage",
  "appointments.clinical.manage",
  "appointments.operations.manage",
  "inventory.manage",
  "inventory.catalog.manage",
  "care_reminders.manage",
  "clients.manage",
] as const;

export const STAFF_PERMISSION_CATALOG = [
  {
    key: "settings.manage",
    label: "Manage practice settings",
    description: "Change clinic-wide configuration and staff settings.",
  },
  {
    key: "staff.roles.manage",
    label: "Manage staff roles and permissions",
    description: "Create roles and assign them to staff and branches.",
  },
  {
    key: "controlled_substances.manage",
    label: "Manage controlled-substance logs",
    description:
      "View balances and record received, administered, wasted, or returned scheduled drugs.",
  },
  {
    key: "appointments.schedule.manage",
    label: "Manage appointment scheduling",
    description:
      "Create, reschedule, and manage recurring appointment schedules.",
  },
  {
    key: "appointments.clinical.manage",
    label: "Manage clinical appointments",
    description: "Start and manage appointment-based clinical workflows.",
  },
  {
    key: "appointments.operations.manage",
    label: "Manage appointment operations",
    description:
      "Update appointment status, attach patients, and cancel appointments.",
  },
  {
    key: "inventory.manage",
    label: "Manage inventory and suppliers",
    description:
      "Manage inventory items, stock quantities, and supplier details.",
  },
  {
    key: "inventory.catalog.manage",
    label: "Manage product catalog and pricing",
    description:
      "Create products and change their prices, costs, and tax settings.",
  },
  {
    key: "care_reminders.manage",
    label: "Manage patient care reminders",
    description:
      "Create, update, dismiss, and send outreach for patient care reminders.",
  },
  {
    key: "clients.manage",
    label: "Manage clients",
    description:
      "Create and update client records, SMS consent, and portal access.",
  },
] as const;

export type StaffPermissionKey =
  (typeof STAFF_PERMISSION_KEYS)[number];
export type LegacyStaffRole =
  | "admin"
  | "veterinarian"
  | "technician"
  | "front_desk"
  | "viewer";

export type StaffRolePermissionAssignment = {
  assignmentActive: boolean;
  locationId: string | null;
  locationActive: boolean;
  permissionKey: string | null;
  roleActive: boolean;
};

export type StaffLocationScope =
  | { kind: "practice" }
  | { kind: "branches"; locationIds: string[] };

export function isStaffPermissionKey(value: string): value is StaffPermissionKey {
  return STAFF_PERMISSION_KEYS.some((permission) => permission === value);
}

const LEGACY_ROLE_PERMISSIONS: Record<
  LegacyStaffRole,
  readonly StaffPermissionKey[]
> = {
  admin: [
    "settings.manage",
    "staff.roles.manage",
    "controlled_substances.manage",
    "appointments.schedule.manage",
    "appointments.clinical.manage",
    "appointments.operations.manage",
    "inventory.manage",
    "inventory.catalog.manage",
    "care_reminders.manage",
    "clients.manage",
  ],
  veterinarian: [
    "controlled_substances.manage",
    "appointments.schedule.manage",
    "appointments.clinical.manage",
    "appointments.operations.manage",
    "inventory.manage",
    "care_reminders.manage",
    "clients.manage",
  ],
  technician: [
    "appointments.clinical.manage",
    "appointments.operations.manage",
    "inventory.manage",
    "care_reminders.manage",
    "clients.manage",
  ],
  front_desk: [
    "appointments.schedule.manage",
    "appointments.operations.manage",
    "inventory.manage",
    "inventory.catalog.manage",
    "care_reminders.manage",
    "clients.manage",
  ],
  viewer: [],
};

export async function loadCustomRolePermissionAssignments(
  db: Database,
  practiceId: string,
  userId: string,
): Promise<StaffRolePermissionAssignment[]> {
  const rows = await db
    .select({
      assignmentActive: isNull(staffRoleAssignments.deletedAt),
      locationId: staffRoleAssignments.locationId,
      locationDeletedAt: locations.deletedAt,
      permissionKey: staffRolePermissions.permissionKey,
      roleActive: isNull(staffRoles.deletedAt),
    })
    .from(staffRoleAssignments)
    .innerJoin(
      staffRoles,
      and(
        eq(staffRoles.id, staffRoleAssignments.roleId),
        eq(staffRoles.practiceId, staffRoleAssignments.practiceId),
        eq(staffRoles.isSystem, false),
      ),
    )
    .leftJoin(
      staffRolePermissions,
      and(
        eq(staffRolePermissions.practiceId, staffRoleAssignments.practiceId),
        eq(staffRolePermissions.roleId, staffRoleAssignments.roleId),
        isNull(staffRoleAssignments.deletedAt),
        isNull(staffRoles.deletedAt),
        isNull(staffRolePermissions.deletedAt),
      ),
    )
    .leftJoin(
      locations,
      and(
        eq(locations.practiceId, staffRoleAssignments.practiceId),
        eq(locations.id, staffRoleAssignments.locationId),
      ),
    )
    .where(
      and(
        eq(staffRoleAssignments.practiceId, practiceId),
        eq(staffRoleAssignments.userId, userId),
      ),
    );

  return rows.map((row) => ({
    assignmentActive: row.assignmentActive,
    locationId: row.locationId,
    locationActive: row.locationDeletedAt === null,
    permissionKey: row.permissionKey,
    roleActive: row.roleActive,
  }));
}

export function effectiveStaffLocationScope(
  assignments: readonly StaffRolePermissionAssignment[],
): StaffLocationScope {
  if (assignments.length === 0) return { kind: "practice" };

  const activeAssignments = assignments.filter(
    (assignment) => assignment.assignmentActive && assignment.roleActive,
  );
  if (activeAssignments.some((assignment) => assignment.locationId === null)) {
    return { kind: "practice" };
  }

  return {
    kind: "branches",
    locationIds: [
      ...new Set(
        activeAssignments.flatMap(({ locationId, locationActive }) =>
          locationId !== null && locationActive ? [locationId] : [],
        ),
      ),
    ],
  };
}

export async function loadStaffLocationScope(
  db: Database,
  practiceId: string,
  userId: string,
): Promise<StaffLocationScope> {
  const assignments = await loadCustomRolePermissionAssignments(
    db,
    practiceId,
    userId,
  );
  return effectiveStaffLocationScope(assignments);
}

export function effectiveStaffPermissions(
  assignments: readonly StaffRolePermissionAssignment[],
  legacyRole: LegacyStaffRole,
  locationId?: string,
): Set<StaffPermissionKey> {
  if (assignments.length === 0) {
    return new Set(LEGACY_ROLE_PERMISSIONS[legacyRole]);
  }

  const granted = new Set<StaffPermissionKey>();
  for (const assignment of assignments) {
    const assignmentApplies =
      assignment.locationId === null ||
      (locationId !== undefined &&
        assignment.locationId === locationId &&
        assignment.locationActive);
    if (
      assignment.assignmentActive &&
      assignment.roleActive &&
      assignmentApplies &&
      assignment.permissionKey !== null &&
      isStaffPermissionKey(assignment.permissionKey)
    ) {
      granted.add(assignment.permissionKey);
    }
  }
  return granted;
}

export function customRoleGrantsAnyPermission(
  assignments: readonly StaffRolePermissionAssignment[],
  permissions: readonly StaffPermissionKey[],
  locationId?: string,
): boolean {
  const granted = effectiveStaffPermissions(assignments, "front_desk", locationId);
  return permissions.some((permission) => granted.has(permission));
}

export function legacyRoleGrantsAnyPermission(
  role: LegacyStaffRole,
  permissions: readonly StaffPermissionKey[],
): boolean {
  const granted = effectiveStaffPermissions([], role);
  return permissions.some((permission) => granted.has(permission));
}
