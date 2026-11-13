import { beforeEach, describe, expect, it, vi } from "vitest";

const { settingsRouter } = await import("../routers/settings");

const PRACTICE_ID = "00000000-0000-0000-0000-0000000000aa";
const USER_ID = "00000000-0000-0000-0000-000000000001";

function createDb(selectResults: unknown[][]) {
  const remaining = [...selectResults];
  const select = vi.fn(() => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.innerJoin = vi.fn(() => query);
    query.leftJoin = vi.fn(() => query);
    query.where = vi.fn(async () => remaining.shift() ?? []);
    return { from: vi.fn(() => query) };
  });
  const insert = vi.fn();
  const db = {
    execute: vi.fn(async () => undefined),
    insert,
    select,
    transaction: async (run: (tx: unknown) => unknown) => run(db),
  };
  return { db, insert };
}

function roleManagerPermissionRow() {
  return {
    assignmentActive: true,
    locationId: null,
    locationDeletedAt: null,
    permissionKey: "staff.roles.manage",
    roleActive: true,
  };
}

function callerWithDb(db: ReturnType<typeof createDb>["db"]) {
  return settingsRouter.createCaller({
    db,
    session: {
      user: {
        id: USER_ID,
        email: "manager@example.com",
        name: "Manager",
        role: "front_desk",
        practiceId: PRACTICE_ID,
      },
    },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("settings staff role management", () => {
  it("does not allow a role manager to grant permissions they do not have", async () => {
    const { db, insert } = createDb([
      [roleManagerPermissionRow()],
      [roleManagerPermissionRow()],
    ]);

    await expect(
      callerWithDb(db).createStaffRole({
        name: "Practice settings",
        description: undefined,
        permissions: ["settings.manage"],
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("shows only permissions available to the current role manager", async () => {
    const { db } = createDb([
      [roleManagerPermissionRow()],
      [roleManagerPermissionRow()],
    ]);

    await expect(callerWithDb(db).getStaffPermissionCatalog()).resolves.toEqual([
      expect.objectContaining({ key: "staff.roles.manage" }),
    ]);
  });
});
