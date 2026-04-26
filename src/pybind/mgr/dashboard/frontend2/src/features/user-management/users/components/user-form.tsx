import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRoles } from '../../roles/api/use-role';
import {
  useCreateDashboardUser,
  useUpdateDashboardUser,
  useValidatePassword,
  useStandardSettings,
  type DashboardUser,
} from '../api/use-dashboard-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const userFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  roles: z.array(z.string()).optional(),
  enabled: z.boolean(),
  pwdExpirationDate: z.string().optional(),
  pwdUpdateRequired: z.boolean(),
}).refine(
  (data) => {
    if (data.password && data.password !== data.confirm_password) {
      return false;
    }
    return true;
  },
  { message: 'Passwords do not match', path: ['confirm_password'] },
);

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: DashboardUser;
  onSuccess: () => void;
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const isEdit = !!initialData;
  const createMutation = useCreateDashboardUser();
  const updateMutation = useUpdateDashboardUser();
  const validatePassword = useValidatePassword();
  const { data: standardSettings } = useStandardSettings();
  const { data: roles = [] } = useRoles();

  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    valuation: string | null;
  } | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: initialData?.username ?? '',
      password: '',
      confirm_password: '',
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      roles: initialData?.roles ?? [],
      enabled: initialData?.enabled ?? true,
      pwdExpirationDate: initialData?.pwdExpirationDate ?? '',
      pwdUpdateRequired: initialData?.pwdUpdateRequired ?? true,
    },
  });

  const watchPassword = form.watch('password');

  useEffect(() => {
    if (watchPassword && watchPassword.length > 0) {
      const timer = setTimeout(() => {
        validatePassword.mutate(
          { password: watchPassword, username: form.getValues('username') },
          {
            onSuccess: (result) => setPasswordStrength(result),
          },
        );
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPasswordStrength(null);
    }
  }, [watchPassword]);

  const onSubmit = async (values: UserFormValues) => {
    try {
      const { confirm_password, ...data } = values;
      if (isEdit) {
        const updateData: Record<string, unknown> = { username: data.username };
        if (data.password) (updateData as Record<string, unknown>).password = data.password;
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        updateData.roles = data.roles ?? [];
        updateData.enabled = data.enabled;
        updateData.pwdExpirationDate = data.pwdExpirationDate || null;
        updateData.pwdUpdateRequired = data.pwdUpdateRequired;
        await updateMutation.mutateAsync(updateData as { username: string; [key: string]: unknown });
        toast.success(`User ${data.username} updated`);
      } else {
        if (!data.password) {
          form.setError('password', { message: 'Password is required' });
          return;
        }
        const createData: Record<string, unknown> = {
          username: data.username,
          password: data.password,
          name: data.name || undefined,
          email: data.email || undefined,
          roles: data.roles ?? [],
          enabled: data.enabled,
          pwdExpirationDate: data.pwdExpirationDate || undefined,
          pwdUpdateRequired: data.pwdUpdateRequired,
        };
        await createMutation.mutateAsync(createData);
        toast.success(`User ${data.username} created`);
      }
      onSuccess();
    } catch {
      toast.error(isEdit ? 'Failed to update user' : 'Failed to create user');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} disabled={isEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEdit ? 'New Password' : 'Password'}</FormLabel>
              <FormControl>
                <Input type="password" {...field} placeholder={isEdit ? 'Leave blank to keep current' : undefined} />
              </FormControl>
              <FormMessage />
              {passwordStrength && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={passwordStrength.valid ? 'default' : 'destructive'}>
                    {passwordStrength.valuation ?? (passwordStrength.valid ? 'Valid' : 'Invalid')}
                  </Badge>
                </div>
              )}
              {standardSettings?.pwd_policy_enabled && (
                <p className="text-xs text-muted-foreground">
                  Min length: {standardSettings.pwd_policy_min_length}
                  {standardSettings.pwd_policy_check_complexity_enabled && ' • Complexity check enabled'}
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const selected = field.value?.includes(role.name);
                  return (
                    <Badge
                      key={role.name}
                      variant={selected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = field.value ?? [];
                        field.onChange(
                          selected
                            ? current.filter((r: string) => r !== role.name)
                            : [...current, role.name],
                        );
                      }}
                    >
                      {role.name}
                    </Badge>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>Enabled</FormLabel>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pwdUpdateRequired"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>Password Update Required</FormLabel>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
