import type { AdminPermissionName, AdminRole, AssignableAdminPermissionName } from '@/types/adminRole.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { showErrorToast } from '@/lib/errorToast';
import { cn } from '@/lib/utilities';
import {
  getAdminPermissionsQueryOptions,
  getAdminRolesQueryOptions,
  useCreateAdminRoleMutation,
  useDeleteAdminRoleMutation,
  useUpdateAdminRoleMutation,
  useUpdateAdminRolePermissionsMutation,
} from '@/queries/adminRole.query';

type CrudAction = 'CREATE' | 'DELETE' | 'READ' | 'UPDATE';

interface EditableModule {
  label: string;
  module: string;
  permissions: Partial<Record<CrudAction, AssignableAdminPermissionName>>;
}

const CRUD_ACTIONS: CrudAction[] = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

const roleFormSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required.').max(80),
  selectedPermissions: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

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

const EMPTY_ROLE_FORM: RoleFormValues = {
  name: '',
  selectedPermissions: [],
};

export default function RolesPermissions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const form = useForm<RoleFormValues>({
    defaultValues: EMPTY_ROLE_FORM,
    resolver: zodResolver(roleFormSchema),
  });
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
  const unsupportedPermissions = editingRole?.permissions
    .map(permission => permission.name)
    .filter(name => !isEditablePermission(name, editableModules)) ?? [];

  const editablePermissionNames = useMemo(
    () => editableModules.flatMap(module =>
      Object.values(module.permissions).filter(
        (permission): permission is AssignableAdminPermissionName => permission !== undefined,
      )),
    [editableModules],
  );

  const isSaving
    = createRole.isPending || updateRole.isPending || updateRolePermissions.isPending;

  const openCreateDialog = () => {
    setEditingRole(null);
    form.reset(EMPTY_ROLE_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (role: AdminRole) => {
    const rolePermissionNames = role.permissions.map(permission => permission.name);
    const supported = rolePermissionNames.filter(name => isEditablePermission(name, editableModules));
    setEditingRole(role);
    form.reset({
      name: role.name,
      selectedPermissions: normalizePermissions(supported),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving)
      return;
    setDialogOpen(false);
    setEditingRole(null);
    form.reset(EMPTY_ROLE_FORM);
  };

  const handleDelete = async (role: AdminRole) => {
    try {
      await deleteRole.mutateAsync(role.id);
      toast.success('Role deleted.');
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to delete role.');
    }
  };

  const handleSave = form.handleSubmit(async ({ name, selectedPermissions }) => {
    const trimmedName = name;
    const finalPermissions = normalizePermissions(
      selectedPermissions.filter((permission): permission is AssignableAdminPermissionName =>
        isEditablePermission(permission, editableModules)),
    );

    if (
      finalPermissions.length === 0
      && (!editingRole || unsupportedPermissions.length === 0)
    ) {
      toast.error('Select at least one permission.');
      return;
    }

    if (!editingRole) {
      try {
        await createRole.mutateAsync({
          name: trimmedName,
          permissions: finalPermissions,
        });
        toast.success('Role created.');
        closeDialog();
      }
      catch (error: any) {
        showErrorToast(error, 'Failed to create role.');
      }
      return;
    }

    const originalName = editingRole.name;
    const originalPermissions = editingRole.permissions.map(permission => permission.name);
    const originalEditablePermissions = originalPermissions.filter(name =>
      isEditablePermission(name, editableModules));
    const didNameChange = originalName !== trimmedName;
    const didPermissionsChange = !sameMembers(originalEditablePermissions, finalPermissions);

    if (didPermissionsChange && unsupportedPermissions.length > 0) {
      toast.error('This role has permissions that cannot be changed with the current API contract.');
      return;
    }

    let didUpdateName = false;

    try {
      if (didNameChange) {
        await updateRole.mutateAsync({
          roleId: editingRole.id,
          payload: { name: trimmedName },
        });
        didUpdateName = true;
      }

      if (didPermissionsChange) {
        await updateRolePermissions.mutateAsync({
          roleId: editingRole.id,
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
      showErrorToast(error, 'Failed to update role.');
    }
  }, errors => toast.error(Object.values(errors)[0]?.message ?? 'Check the role details.'));

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
        <div className="
          flex flex-col gap-3
          md:flex-row md:items-start md:justify-between
        "
        >
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
                    <CardContent className="
                      flex flex-col gap-4 p-4
                      lg:flex-row lg:items-center lg:justify-between
                    "
                    >
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
                        <Button onClick={() => openEditDialog(role)} variant="outline">
                          Edit role
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete role?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes "
                                {role.name}
                                " and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(role)}
                                className="
                                  bg-destructive text-destructive-foreground
                                  hover:bg-destructive/90
                                "
                              >
                                Delete role
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
              {editingRole ? 'Edit role' : 'Create role'}
            </DialogTitle>
            <DialogDescription>
              Configure the role name and assign permissions by module.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role name</Label>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <Input {...field} id="role-name" maxLength={80} />
                  )}
                />
              </div>

              <Controller
                name="selectedPermissions"
                control={form.control}
                render={({ field }) => {
                  const selectedPermissionSet = new Set(field.value);
                  const updatePermissions = (nextPermissions: string[]) =>
                    field.onChange(normalizePermissionNames(nextPermissions));
                  const handleToggleSingle = (permissionName: AssignableAdminPermissionName, checked: boolean) => {
                    const next = new Set(field.value);
                    if (checked)
                      next.add(permissionName);
                    else
                      next.delete(permissionName);
                    updatePermissions([...next]);
                  };
                  const handleToggleModule = (module: EditableModule) => {
                    const next = new Set(field.value);
                    const modulePermissions = Object.values(module.permissions).filter(
                      (permission): permission is AssignableAdminPermissionName => permission !== undefined,
                    );
                    const allSelected = modulePermissions.every(permission => next.has(permission));
                    for (const permission of modulePermissions) {
                      if (allSelected)
                        next.delete(permission);
                      else
                        next.add(permission);
                    }
                    updatePermissions([...next]);
                  };
                  const handleToggleAll = () => {
                    const allSelected = editablePermissionNames.every(permission =>
                      selectedPermissionSet.has(permission));
                    field.onChange(allSelected ? [] : normalizePermissions(editablePermissionNames));
                  };

                  return (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">Roles & Permissions</p>
                            <p className="text-sm text-muted-foreground">
                              Toggle all editable permissions.
                            </p>
                          </div>
                          <Button
                            onClick={handleToggleAll}
                            disabled={unsupportedPermissions.length > 0}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {editablePermissionNames.every(permission =>
                              selectedPermissionSet.has(permission))
                              ? 'Uncheck all'
                              : 'Check all'}
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {editableModules.map((module) => {
                            const modulePermissions = Object.values(module.permissions).filter(
                              (permission): permission is AssignableAdminPermissionName => permission !== undefined,
                            );
                            const allSelected = modulePermissions.every(permission =>
                              selectedPermissionSet.has(permission));

                            return (
                              <div key={module.module} className="rounded-lg border border-border">
                                <div className="
                                  flex flex-col gap-3 border-b border-border bg-muted/30 px-4 py-3
                                  md:flex-row md:items-center md:justify-between
                                "
                                >
                                  <div>
                                    <p className="font-medium text-foreground">{module.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Select only the permissions this role should have.
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => handleToggleModule(module)}
                                    disabled={unsupportedPermissions.length > 0}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    {allSelected ? 'Uncheck' : 'Check'}
                                  </Button>
                                </div>

                                <div className="
                                  grid gap-3 p-4
                                  sm:grid-cols-2
                                  lg:grid-cols-4
                                "
                                >
                                  {CRUD_ACTIONS.map((action) => {
                                    const permissionName = module.permissions[action];
                                    const checked = permissionName
                                      ? selectedPermissionSet.has(permissionName)
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
                                          onCheckedChange={value =>
                                            permissionName && handleToggleSingle(permissionName, value === true)}
                                          checked={checked}
                                          disabled={!permissionName || unsupportedPermissions.length > 0}
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

                      {unsupportedPermissions.length > 0 && (
                        <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                          <div>
                            <p className="font-medium text-foreground">Other permissions</p>
                            <p className="text-sm text-muted-foreground">
                              These permissions are preserved and cannot be edited here. Permission changes are
                              disabled for this role until the API contract supports them.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {unsupportedPermissions.map(permission => (
                              <Badge key={permission} variant="outline">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                          {field.value.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              This role will keep only the read-only permissions above unless you add editable permissions.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  );
                }}
              />
            </div>

            <DialogFooter>
              <Button onClick={closeDialog} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving ? 'Saving...' : 'Save role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function buildEditableModules(permissions: { name: AdminPermissionName }[]): EditableModule[] {
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

    current.permissions[parsed.action] = permission.name as AssignableAdminPermissionName;
    grouped.set(parsed.module, current);
  }

  return grouped.values().toArray().toSorted((left, right) =>
    left.label.localeCompare(right.label),
  );
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

function normalizePermissions(
  permissionNames: AssignableAdminPermissionName[],
): AssignableAdminPermissionName[] {
  return normalizePermissionNames(permissionNames) as AssignableAdminPermissionName[];
}

function normalizePermissionNames(permissionNames: string[]): string[] {
  const values = new Set(permissionNames);

  for (const name of values) {
    const parsed = parsePermissionName(name);
    if (!parsed)
      continue;
    if (parsed.action !== 'READ') {
      // eslint-disable-next-line unicorn/no-loop-iterable-mutation
      values.add(`${parsed.module}_READ` as AssignableAdminPermissionName);
    }
  }

  return [...values].toSorted((a, b) => a.localeCompare(b));
}

function isEditablePermission(
  name: string,
  editableModules: EditableModule[],
): name is AssignableAdminPermissionName {
  return editableModules.some(module =>
    Object.values(module.permissions).includes(name as AssignableAdminPermissionName));
}

function sameMembers(left: string[], right: string[]) {
  const normalizedLeft = normalizePermissionNames(left);
  const normalizedRight = normalizePermissionNames(right);

  if (normalizedLeft.length !== normalizedRight.length)
    return false;

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function roleSummary(role: AdminRole) {
  const moduleLabels = [...new Set(
    role.permissions
      .map(permission => parsePermissionName(permission.name)?.module)
      .filter((value): value is string => Boolean(value))
      .map(module => MODULE_LABELS[module] ?? module),
  )];

  if (moduleLabels.length === 0)
    return 'No permissions assigned.';

  if (moduleLabels.length <= 3)
    return moduleLabels.join(', ');

  return `${moduleLabels.slice(0, 3).join(', ')} +${moduleLabels.length - 3} more`;
}
