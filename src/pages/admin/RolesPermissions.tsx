import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utilities';
import {
  getAdminPermissionsQueryOptions,
  getAdminRolesQueryOptions,
  useCreateAdminRoleMutation,
  useDeleteAdminRoleMutation,
  useUpdateAdminRoleMutation,
  useUpdateAdminRolePermissionsMutation,
} from '@/queries/adminRole.query';
import type { AdminRole } from '@/types/adminRole.type';

type CrudAction = 'CREATE' | 'DELETE' | 'READ' | 'UPDATE';

interface EditableModule {
  label: string;
  module: string;
  permissions: Partial<Record<CrudAction, string>>;
}

interface RoleDialogState {
  name: string;
  role: AdminRole | null;
  selectedPermissions: Set<string>;
  unsupportedPermissions: string[];
}

const CRUD_ACTIONS: CrudAction[] = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

const MODULE_LABELS: Record<string, string> = {
  ANALYTICS: 'Analytics',
  BOOSTS: 'Boosts',
  BRANDS: 'Brands',
  CATALOG: 'Catalog',
  COMPLAINTS: 'Complaints',
  LISTINGS: 'Listings',
  MARKETING_LEADS: 'Marketing Leads',
  MESSAGES: 'Messages',
  ORDERS: 'Orders',
  PAYOUTS: 'Payouts',
  REPORTS: 'Reports',
  ROLES_AND_PERMISSIONS: 'Roles & Permissions',
  SELLER_COUPONS: 'Seller Coupons',
  SETTINGS: 'Settings',
  SUPPORT_TICKETS: 'Support Tickets',
  USERS: 'Users',
};

const SUPPORTED_MODULES = new Set(Object.keys(MODULE_LABELS));

const EMPTY_ROLE_DIALOG: RoleDialogState = {
  name: '',
  role: null,
  selectedPermissions: new Set<string>(),
  unsupportedPermissions: [],
};

export default function RolesPermissions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialog, setDialog] = useState<RoleDialogState>(EMPTY_ROLE_DIALOG);
  const { data: roles = [], isLoading: rolesLoading, refetch } = useQuery(getAdminRolesQueryOptions());
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery(getAdminPermissionsQueryOptions());

  const createRole = useCreateAdminRoleMutation();
  const deleteRole = useDeleteAdminRoleMutation();
  const updateRole = useUpdateAdminRoleMutation();
  const updateRolePermissions = useUpdateAdminRolePermissionsMutation();

  const editableModules = useMemo(
    () => buildEditableModules(permissions),
    [permissions],
  );

  const editablePermissionNames = useMemo(
    () => editableModules.flatMap(module =>
      Object.values(module.permissions).filter(Boolean) as string[]),
    [editableModules],
  );

  const isSaving
    = createRole.isPending || updateRole.isPending || updateRolePermissions.isPending;

  const openCreateDialog = () => {
    setDialog(EMPTY_ROLE_DIALOG);
    setDialogOpen(true);
  };

  const openEditDialog = (role: AdminRole) => {
    const rolePermissionNames = role.permissions.map(permission => permission.name);
    const supported = rolePermissionNames.filter(name => isEditablePermission(name, editableModules));
    const unsupported = rolePermissionNames.filter(name => !isEditablePermission(name, editableModules));

    setDialog({
      name: role.name,
      role,
      selectedPermissions: new Set(normalizePermissions(supported)),
      unsupportedPermissions: unsupported,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving)
      return;
    setDialogOpen(false);
    setDialog(EMPTY_ROLE_DIALOG);
  };

  const toggleSinglePermission = (permissionName: string, checked: boolean) => {
    setDialog((current) => {
      const next = new Set(current.selectedPermissions);
      if (checked)
        next.add(permissionName);
      else
        next.delete(permissionName);

      return {
        ...current,
        selectedPermissions: new Set(normalizePermissions(Array.from(next))),
      };
    });
  };

  const toggleModule = (module: EditableModule) => {
    setDialog((current) => {
      const next = new Set(current.selectedPermissions);
      const modulePermissions = Object.values(module.permissions).filter(Boolean) as string[];
      const allSelected = modulePermissions.every(permission => next.has(permission));

      for (const permission of modulePermissions) {
        if (allSelected)
          next.delete(permission);
        else
          next.add(permission);
      }

      return {
        ...current,
        selectedPermissions: new Set(normalizePermissions(Array.from(next))),
      };
    });
  };

  const toggleAll = () => {
    setDialog((current) => {
      const allSelected = editablePermissionNames.every(permission =>
        current.selectedPermissions.has(permission));

      return {
        ...current,
        selectedPermissions: new Set(
          allSelected ? [] : normalizePermissions(editablePermissionNames),
        ),
      };
    });
  };

  const handleDelete = async (role: AdminRole) => {
    if (!window.confirm(`Delete the role "${role.name}"?`))
      return;

    try {
      await deleteRole.mutateAsync(role.id);
      toast.success('Role deleted.');
    }
    catch (error: any) {
      toast.error(error.message ?? 'Failed to delete role.');
    }
  };

  const handleSave = async () => {
    const trimmedName = dialog.name.trim();
    const finalPermissions = normalizePermissions([
      ...Array.from(dialog.selectedPermissions),
      ...dialog.unsupportedPermissions,
    ]);

    if (!trimmedName) {
      toast.error('Role name is required.');
      return;
    }

    if (finalPermissions.length === 0) {
      toast.error('Select at least one permission.');
      return;
    }

    if (!dialog.role) {
      try {
        await createRole.mutateAsync({
          name: trimmedName,
          permissions: finalPermissions,
        });
        toast.success('Role created.');
        closeDialog();
      }
      catch (error: any) {
        toast.error(error.message ?? 'Failed to create role.');
      }
      return;
    }

    const originalName = dialog.role.name;
    const originalPermissions = dialog.role.permissions.map(permission => permission.name);
    const didNameChange = originalName !== trimmedName;
    const didPermissionsChange = !sameMembers(originalPermissions, finalPermissions);
    let didUpdateName = false;

    try {
      if (didNameChange) {
        await updateRole.mutateAsync({
          roleId: dialog.role.id,
          payload: { name: trimmedName },
        });
        didUpdateName = true;
      }

      if (didPermissionsChange) {
        await updateRolePermissions.mutateAsync({
          roleId: dialog.role.id,
          payload: { permissions: finalPermissions },
        });
      }

      toast.success('Role updated.');
      closeDialog();
    }
    catch (error: any) {
      if (didUpdateName) {
        await refetch();
      }
      toast.error(error.message ?? 'Failed to update role.');
    }
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Roles & Permissions
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage custom staff roles and assignable permissions.
            </p>
          </div>

          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create role
          </Button>
        </div>

        {roles.length === 0
          ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No custom roles available.
                </CardContent>
              </Card>
            )
          : (
              <div className="space-y-3">
                {roles.map(role => (
                  <Card key={role.id}>
                    <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-xl font-semibold text-foreground">
                            {role.name}
                          </h2>
                          <Badge variant="secondary">
                            {role.permissions.length}
                            {' '}
                            permissions
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {roleSummary(role)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => openEditDialog(role)}>
                          Edit role
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(role)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
      </div>

      <Dialog onOpenChange={open => !open && closeDialog()} open={dialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.role ? 'Edit role' : 'Create role'}
            </DialogTitle>
            <DialogDescription>
              Configure the role name and assign permissions by module.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={dialog.name}
                maxLength={80}
                onChange={event => setDialog(current => ({ ...current, name: event.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">Roles & Permissions</p>
                  <p className="text-sm text-muted-foreground">
                    Toggle all editable permissions.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {editablePermissionNames.every(permission =>
                    dialog.selectedPermissions.has(permission))
                    ? 'Uncheck all'
                    : 'Check all'}
                </Button>
              </div>

              <div className="space-y-4">
                {editableModules.map((module) => {
                  const modulePermissions = Object.values(module.permissions).filter(Boolean) as string[];
                  const allSelected = modulePermissions.every(permission =>
                    dialog.selectedPermissions.has(permission));

                  return (
                    <div key={module.module} className="rounded-lg border border-border">
                      <div className="flex flex-col gap-3 border-b border-border bg-muted/30 px-4 py-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{module.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Select only the permissions this role should have.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleModule(module)}
                        >
                          {allSelected ? 'Uncheck' : 'Check'}
                        </Button>
                      </div>

                      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        {CRUD_ACTIONS.map((action) => {
                          const permissionName = module.permissions[action];
                          const checked = permissionName
                            ? dialog.selectedPermissions.has(permissionName)
                            : false;

                          return (
                            <label
                              key={action}
                              className={cn(
                                'flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm',
                                !permissionName && 'opacity-50',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                disabled={!permissionName}
                                onCheckedChange={value =>
                                  permissionName && toggleSinglePermission(permissionName, value === true)}
                              />
                              <span>{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {dialog.unsupportedPermissions.length > 0 && (
              <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Other permissions</p>
                  <p className="text-sm text-muted-foreground">
                    These permissions are preserved on save but cannot be edited here.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dialog.unsupportedPermissions.map(permission => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
                {dialog.selectedPermissions.size === 0 && (
                  <p className="text-sm text-muted-foreground">
                    This role will keep only the read-only permissions above unless you add editable permissions.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function buildEditableModules(permissions: { name: string }[]): EditableModule[] {
  const grouped = new Map<string, EditableModule>();

  for (const permission of permissions) {
    const parsed = parsePermissionName(permission.name);
    if (!parsed || !SUPPORTED_MODULES.has(parsed.module))
      continue;

    const current = grouped.get(parsed.module) ?? {
      label: MODULE_LABELS[parsed.module],
      module: parsed.module,
      permissions: {},
    };

    current.permissions[parsed.action] = permission.name;
    grouped.set(parsed.module, current);
  }

  return Array.from(grouped.values()).sort((left, right) =>
    left.label.localeCompare(right.label));
}

function parsePermissionName(name: string) {
  const index = name.lastIndexOf('_');
  if (index === -1)
    return null;

  const module = name.slice(0, index);
  const action = name.slice(index + 1) as CrudAction;
  if (!CRUD_ACTIONS.includes(action))
    return null;

  return { action, module };
}

function normalizePermissions(permissionNames: string[]) {
  const values = new Set(permissionNames);

  for (const name of Array.from(values)) {
    const parsed = parsePermissionName(name);
    if (!parsed)
      continue;
    if (parsed.action !== 'READ') {
      values.add(`${parsed.module}_READ`);
    }
  }

  return Array.from(values).sort();
}

function isEditablePermission(name: string, editableModules: EditableModule[]) {
  return editableModules.some(module =>
    Object.values(module.permissions).includes(name));
}

function sameMembers(left: string[], right: string[]) {
  const normalizedLeft = normalizePermissions(left);
  const normalizedRight = normalizePermissions(right);

  if (normalizedLeft.length !== normalizedRight.length)
    return false;

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function roleSummary(role: AdminRole) {
  const moduleLabels = Array.from(
    new Set(
      role.permissions
        .map(permission => parsePermissionName(permission.name)?.module)
        .filter((value): value is string => Boolean(value))
        .map(module => MODULE_LABELS[module] ?? module),
    ),
  );

  if (moduleLabels.length === 0)
    return 'No permissions assigned.';

  if (moduleLabels.length <= 3)
    return moduleLabels.join(', ');

  return `${moduleLabels.slice(0, 3).join(', ')} +${moduleLabels.length - 3} more`;
}
