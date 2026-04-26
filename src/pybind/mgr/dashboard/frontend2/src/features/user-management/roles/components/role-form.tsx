import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { useScopes } from '../api/use-scope';
import {
  useCreateRole,
  useUpdateRole,
  type Role,
} from '../api/use-role';
import { SCOPE_SERVER_KEY, type PermissionScope } from '@/types/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const PERMISSIONS = ['read', 'create', 'update', 'delete'] as const;

const roleFormSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  scopes_permissions: z.record(z.array(z.string())),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  initialData?: Role;
  cloneFrom?: Role;
  onSuccess: () => void;
}

export function RoleForm({ initialData, cloneFrom, onSuccess }: RoleFormProps) {
  const isEdit = !!initialData && !cloneFrom;
  const isSystemRole = initialData?.system && !cloneFrom;
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const { data: scopes = [] } = useScopes();

  const sourceData = cloneFrom ?? initialData;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: cloneFrom ? '' : (sourceData?.name ?? ''),
      description: sourceData?.description ?? '',
      scopes_permissions: sourceData?.scopes_permissions ?? {},
    },
  });

  const onSubmit = async (values: RoleFormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          name: values.name,
          description: values.description,
          scopes_permissions: values.scopes_permissions,
        });
        toast.success(`Role ${values.name} updated`);
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          description: values.description,
          scopes_permissions: values.scopes_permissions,
        });
        toast.success(`Role ${values.name} created`);
      }
      onSuccess();
    } catch {
      toast.error(isEdit ? 'Failed to update role' : 'Failed to create role');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const scopeLabels: Record<string, string> = {};
  for (const [key, serverKey] of Object.entries(SCOPE_SERVER_KEY)) {
    scopeLabels[serverKey] = key;
  }

  const sortedScopes = [...scopes].sort();

  const togglePermission = (scope: string, perm: string, current: Record<string, string[]>) => {
    const perms = current[scope] ?? [];
    const updated = perms.includes(perm)
      ? perms.filter((p) => p !== perm)
      : [...perms, perm];
    return { ...current, [scope]: updated };
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isEdit || isSystemRole} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSystemRole} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scopes_permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permissions</FormLabel>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Scope</th>
                      {PERMISSIONS.map((perm) => (
                        <th key={perm} className="text-center p-2 font-medium capitalize">
                          {perm}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScopes.map((scope) => {
                      const label = scopeLabels[scope] ?? scope;
                      const perms = field.value[scope] ?? [];
                      return (
                        <tr key={scope} className="border-b last:border-0">
                          <td className="p-2 text-muted-foreground">{label}</td>
                          {PERMISSIONS.map((perm) => (
                            <td key={perm} className="text-center p-2">
                              <Checkbox
                                checked={perms.includes(perm)}
                                onCheckedChange={() =>
                                  field.onChange(togglePermission(scope, perm, field.value))
                                }
                                disabled={isSystemRole}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || isSystemRole}>
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
