import { describe, expect, it } from "vitest";
import {
  customRoleGrantsAnyPermission,
  effectiveStaffLocationScope,
  legacyRoleGrantsAnyPermission,
} from "../authorization/staff-permissions";

describe("staff role permissions", () => {
  it("uses practice-wide scope only when there is no custom assignment history", () => {
    expect(effectiveStaffLocationScope([])).toEqual({ kind: "practice" });
    expect(
      effectiveStaffLocationScope([
        {
          assignmentActive: false,
          locationId: "branch-a",
          locationActive: true,
          permissionKey: null,
          roleActive: true,
        },
      ]),
    ).toEqual({ kind: "branches", locationIds: [] });
  });

  it("limits custom assignments to active assigned branches", () => {
    expect(
      effectiveStaffLocationScope([
        {
          assignmentActive: true,
          locationId: "branch-a",
          locationActive: true,
          permissionKey: "appointments.schedule.manage",
          roleActive: true,
        },
        {
          assignmentActive: true,
          locationId: "branch-b",
          locationActive: false,
          permissionKey: "appointments.schedule.manage",
          roleActive: true,
        },
      ]),
    ).toEqual({ kind: "branches", locationIds: ["branch-a"] });
  });

  it("treats an active practice-wide custom assignment as practice-wide", () => {
    expect(
      effectiveStaffLocationScope([
        {
          assignmentActive: true,
          locationId: "branch-a",
          locationActive: true,
          permissionKey: "appointments.schedule.manage",
          roleActive: true,
        },
        {
          assignmentActive: true,
          locationId: null,
          locationActive: true,
          permissionKey: "appointments.schedule.manage",
          roleActive: true,
        },
      ]),
    ).toEqual({ kind: "practice" });
  });

  it("preserves legacy appointment access by role", () => {
    const appointmentPermissions = [
      "appointments.schedule.manage",
      "appointments.clinical.manage",
      "appointments.operations.manage",
    ] as const;

    expect(legacyRoleGrantsAnyPermission("admin", appointmentPermissions)).toBe(
      true,
    );
    expect(
      legacyRoleGrantsAnyPermission(
        "veterinarian",
        appointmentPermissions,
      ),
    ).toBe(true);
    expect(
      legacyRoleGrantsAnyPermission("technician", [
        "appointments.clinical.manage",
        "appointments.operations.manage",
      ]),
    ).toBe(true);
    expect(
      legacyRoleGrantsAnyPermission("technician", [
        "appointments.schedule.manage",
      ]),
    ).toBe(false);
    expect(
      legacyRoleGrantsAnyPermission("front_desk", [
        "appointments.schedule.manage",
        "appointments.operations.manage",
      ]),
    ).toBe(true);
    expect(
      legacyRoleGrantsAnyPermission("front_desk", [
        "appointments.clinical.manage",
      ]),
    ).toBe(false);
    expect(legacyRoleGrantsAnyPermission("viewer", appointmentPermissions)).toBe(
      false,
    );
  });

  it("preserves settings access for legacy administrators during migration", () => {
    expect(legacyRoleGrantsAnyPermission("admin", ["settings.manage"])).toBe(
      true,
    );
    expect(
      legacyRoleGrantsAnyPermission("front_desk", ["settings.manage"]),
    ).toBe(false);
  });

  it("uses custom permissions instead of falling back to a legacy grant", () => {
    const assignments = [
      {
        assignmentActive: true,
        locationId: null,
        locationActive: true,
        permissionKey: "settings.manage",
        roleActive: true,
      },
    ];

    expect(
      customRoleGrantsAnyPermission(assignments, ["staff.roles.manage"]),
    ).toBe(false);
  });

  it("requires a matching active branch for branch-scoped grants", () => {
    const assignments = [
      {
        assignmentActive: true,
        locationId: "branch-a",
        locationActive: true,
        permissionKey: "settings.manage",
        roleActive: true,
      },
    ];

    expect(
      customRoleGrantsAnyPermission(assignments, ["settings.manage"]),
    ).toBe(false);
    expect(
      customRoleGrantsAnyPermission(
        assignments,
        ["settings.manage"],
        "branch-b",
      ),
    ).toBe(false);
    expect(
      customRoleGrantsAnyPermission(
        assignments,
        ["settings.manage"],
        "branch-a",
      ),
    ).toBe(true);
  });

  it("does not grant permissions from an inactive branch", () => {
    expect(
      customRoleGrantsAnyPermission(
        [
          {
            assignmentActive: true,
            locationId: "branch-a",
            locationActive: false,
            permissionKey: "settings.manage",
            roleActive: true,
          },
        ],
        ["settings.manage"],
        "branch-a",
      ),
    ).toBe(false);
  });

  it("does not restore legacy grants after custom role access is removed", () => {
    expect(
      customRoleGrantsAnyPermission(
        [
          {
            assignmentActive: false,
            locationId: null,
            locationActive: true,
            permissionKey: null,
            roleActive: true,
          },
        ],
        ["settings.manage"],
      ),
    ).toBe(false);
  });
});
