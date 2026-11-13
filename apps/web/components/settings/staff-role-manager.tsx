"use client";

import { useState } from "react";
import { Pencil, Plus, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  isStaffPermissionKey,
  type StaffPermissionKey,
} from "@/lib/authorization/staff-permissions";
import { toast } from "sonner";

type RoleForm = {
  name: string;
  description: string;
  permissions: StaffPermissionKey[];
};

const emptyRoleForm: RoleForm = {
  name: "",
  description: "",
  permissions: [],
};

export function StaffRoleManager() {
  const utils = trpc.useUtils();
  const permissionCatalog = trpc.settings.getStaffPermissionCatalog.useQuery();
  const canManage = Boolean(permissionCatalog.data);
  const roles = trpc.settings.listStaffRoles.useQuery(undefined, {
    enabled: canManage,
  });
  const assignments = trpc.settings.listStaffRoleAssignments.useQuery(
    undefined,
    { enabled: canManage },
  );
  const staff = trpc.settings.listAssignableStaff.useQuery(undefined, {
    enabled: canManage,
  });
  const locations = trpc.settings.listStaffRoleLocations.useQuery(undefined, {
    enabled: canManage,
  });
  const [form, setForm] = useState<RoleForm>(emptyRoleForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState({
    userId: "",
    roleId: "",
    locationId: "",
  });

  const refresh = () => {
    void utils.settings.listStaffRoles.invalidate();
    void utils.settings.listStaffRoleAssignments.invalidate();
  };
  const createRole = trpc.settings.createStaffRole.useMutation({
    onSuccess: () => {
      refresh();
      setForm(emptyRoleForm);
      toast.success("Role created");
    },
    onError: (error) => toast.error(error.message),
  });
  const updateRole = trpc.settings.updateStaffRole.useMutation({
    onSuccess: () => {
      refresh();
      setEditingId(null);
      setForm(emptyRoleForm);
      toast.success("Role updated");
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteRole = trpc.settings.deleteStaffRole.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });
  const assignRole = trpc.settings.assignStaffRole.useMutation({
    onSuccess: () => {
      refresh();
      setAssignment({ userId: "", roleId: "", locationId: "" });
      toast.success("Role assigned");
    },
    onError: (error) => toast.error(error.message),
  });
  const revokeAssignment =
    trpc.settings.revokeStaffRoleAssignment.useMutation({
      onSuccess: refresh,
      onError: (error) => toast.error(error.message),
    });

  if (permissionCatalog.error?.data?.code === "FORBIDDEN") {
    return null;
  }
  if (permissionCatalog.isLoading) {
    return (
      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        Checking role management access…
      </div>
    );
  }
  if (permissionCatalog.error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
      >
        Could not load role permissions: {permissionCatalog.error.message}
      </div>
    );
  }
  if (!permissionCatalog.data) {
    return null;
  }

  const loading =
    roles.isLoading ||
    assignments.isLoading ||
    staff.isLoading ||
    locations.isLoading;
  const error =
    roles.error ?? assignments.error ?? staff.error ?? locations.error;
  if (loading) {
    return (
      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        Loading custom staff roles…
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
      >
        Could not load staff roles: {error.message}
      </div>
    );
  }

  const roleList = roles.data ?? [];
  const assignmentList = assignments.data ?? [];
  const staffList = staff.data ?? [];
  const locationList = locations.data ?? [];
  const defaultUserId = staffList[0]?.id ?? "";
  const defaultRoleId = roleList[0]?.id ?? "";
  const selectedUserId = assignment.userId || defaultUserId;
  const selectedRoleId = assignment.roleId || defaultRoleId;
  const isSaving = createRole.isPending || updateRole.isPending;
  const canSaveRole =
    form.name.trim().length > 0 &&
    form.name.trim().length <= 100 &&
    form.description.trim().length <= 500 &&
    !isSaving;

  function saveRole() {
    const input = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      permissions: form.permissions,
    };
    if (editingId) {
      updateRole.mutate({ id: editingId, ...input });
    } else {
      createRole.mutate(input);
    }
  }

  function startEditing(role: (typeof roleList)[number]) {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions.filter(isStaffPermissionKey),
    });
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">Custom staff roles</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create roles and assign them to the whole practice or a specific
            branch. You can only grant permissions available to your account.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3 rounded-md border border-border p-3">
          <h4 className="text-sm font-medium">
            {editingId ? "Edit role" : "Create role"}
          </h4>
          <Input
            aria-label="Role name"
            maxLength={100}
            placeholder="Role name"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
          />
          <Input
            aria-label="Role description"
            maxLength={500}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium">Permissions</legend>
            {permissionCatalog.data.map((permission) => (
              <label
                key={permission.key}
                className="flex cursor-pointer items-start gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.permissions.includes(permission.key)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      permissions: event.target.checked
                        ? [...form.permissions, permission.key]
                        : form.permissions.filter(
                            (key) => key !== permission.key,
                          ),
                    })
                  }
                />
                <span>
                  <span className="block">{permission.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {permission.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!canSaveRole}
              onClick={saveRole}
            >
              {editingId ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingId ? "Save changes" : "Create role"}
            </Button>
            {editingId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyRoleForm);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Existing roles</h4>
            {roleList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom roles have been created.
              </p>
            ) : (
              roleList.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {role.permissions
                        .map(
                          (key) =>
                            permissionCatalog.data.find(
                              (permission) => permission.key === key,
                            )?.label ?? key,
                        )
                        .join(", ") || "No permissions"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Edit ${role.name}`}
                      onClick={() => startEditing(role)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${role.name}`}
                      disabled={deleteRole.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${role.name}"? Its active assignments will stop granting permissions.`,
                          )
                        ) {
                          deleteRole.mutate({ id: role.id });
                          if (editingId === role.id) {
                            setEditingId(null);
                            setForm(emptyRoleForm);
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <h4 className="text-sm font-medium">Assign a role</h4>
            {staffList.length === 0 || roleList.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add a non-administrator staff member and a custom role before
                assigning access.
              </p>
            ) : (
              <>
                <select
                  aria-label="Staff member"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedUserId}
                  onChange={(event) =>
                    setAssignment({ ...assignment, userId: event.target.value })
                  }
                >
                  {staffList.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Custom role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedRoleId}
                  onChange={(event) =>
                    setAssignment({ ...assignment, roleId: event.target.value })
                  }
                >
                  {roleList.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Branch scope"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={assignment.locationId}
                  onChange={(event) =>
                    setAssignment({
                      ...assignment,
                      locationId: event.target.value,
                    })
                  }
                >
                  <option value="">All branches</option>
                  {locationList.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                      {location.isPrimary ? " (Primary)" : ""}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={
                    assignRole.isPending ||
                    !selectedUserId ||
                    !selectedRoleId
                  }
                  onClick={() =>
                    assignRole.mutate({
                      userId: selectedUserId,
                      roleId: selectedRoleId,
                      locationId: assignment.locationId || null,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Assign role
                </Button>
              </>
            )}
          </div>

          {assignmentList.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current assignments</h4>
              {assignmentList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {item.userName} — {item.roleName} (
                    {item.locationId
                      ? (item.locationName ?? "Inactive branch")
                      : "All branches"}
                    )
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Revoke ${item.roleName} from ${item.userName}`}
                    disabled={revokeAssignment.isPending}
                    onClick={() => revokeAssignment.mutate({ id: item.id })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
