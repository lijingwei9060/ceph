import { useCreateRgwUser, useUpdateRgwUser, useSetRgwUserQuota, useRgwUserQuota, type RgwUser } from '../api/use-rgw-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

const userFormSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  display_name: z.string().min(1, 'Display name is required'),
  email: z.string().optional(),
  max_buckets_mode: z.enum(['-1', '0', '1']).default('1'),
  max_buckets: z.coerce.number().min(1).default(1000),
  suspended: z.boolean().default(false),
  generate_key: z.boolean().default(true),
  access_key: z.string().optional(),
  secret_key: z.string().optional(),
  user_quota_enabled: z.boolean().default(false),
  user_quota_max_size_unlimited: z.boolean().default(true),
  user_quota_max_size: z.string().default(''),
  user_quota_max_objects_unlimited: z.boolean().default(true),
  user_quota_max_objects: z.coerce.number().min(0).default(0),
  bucket_quota_enabled: z.boolean().default(false),
  bucket_quota_max_size_unlimited: z.boolean().default(true),
  bucket_quota_max_size: z.string().default(''),
  bucket_quota_max_objects_unlimited: z.boolean().default(true),
  bucket_quota_max_objects: z.coerce.number().min(0).default(0),
});

type UserFormData = z.infer<typeof userFormSchema>;

function parseSize(input: string): number {
  const match = input.match(/^(\d+(?:\.\d+)?)\s*([KMGTPE]?)B?$/i);
  if (!match) return parseInt(input, 10) || 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4, P: 1024 ** 5, E: 1024 ** 6 };
  return Math.floor(num * (multipliers[unit] ?? 1));
}

export function RgwUserForm({
  initialData,
  onSuccess,
}: {
  initialData?: RgwUser;
  onSuccess: () => void;
}) {
  const isEdit = !!initialData;
  const createUser = useCreateRgwUser();
  const updateUser = useUpdateRgwUser();
  const setQuota = useSetRgwUserQuota();
  const { data: quotaData } = useRgwUserQuota(isEdit ? initialData.user_id : null);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      uid: initialData?.user_id ?? '',
      display_name: initialData?.display_name ?? '',
      email: initialData?.email ?? '',
      max_buckets_mode: initialData?.max_buckets === -1 ? '-1' : initialData?.max_buckets === 0 ? '0' : '1',
      max_buckets: initialData?.max_buckets && initialData.max_buckets > 0 ? initialData.max_buckets : 1000,
      suspended: initialData?.suspended ?? false,
      generate_key: true,
      access_key: '',
      secret_key: '',
      user_quota_enabled: quotaData?.user_quota?.enabled ?? initialData?.user_quota?.enabled ?? false,
      user_quota_max_size_unlimited: !(quotaData?.user_quota?.max_size_kb) && !(initialData?.user_quota?.max_size_kb),
      user_quota_max_size: '',
      user_quota_max_objects_unlimited: !(quotaData?.user_quota?.max_objects) && !(initialData?.user_quota?.max_objects),
      user_quota_max_objects: quotaData?.user_quota?.max_objects ?? initialData?.user_quota?.max_objects ?? 0,
      bucket_quota_enabled: quotaData?.bucket_quota?.enabled ?? initialData?.bucket_quota?.enabled ?? false,
      bucket_quota_max_size_unlimited: !(quotaData?.bucket_quota?.max_size_kb) && !(initialData?.bucket_quota?.max_size_kb),
      bucket_quota_max_size: '',
      bucket_quota_max_objects_unlimited: !(quotaData?.bucket_quota?.max_objects) && !(initialData?.bucket_quota?.max_objects),
      bucket_quota_max_objects: quotaData?.bucket_quota?.max_objects ?? initialData?.bucket_quota?.max_objects ?? 0,
    },
  });

  useEffect(() => {
    if (quotaData) {
      form.setValue('user_quota_enabled', quotaData.user_quota?.enabled ?? false);
      form.setValue('user_quota_max_objects_unlimited', !quotaData.user_quota?.max_objects);
      form.setValue('user_quota_max_objects', quotaData.user_quota?.max_objects ?? 0);
      form.setValue('bucket_quota_enabled', quotaData.bucket_quota?.enabled ?? false);
      form.setValue('bucket_quota_max_objects_unlimited', !quotaData.bucket_quota?.max_objects);
      form.setValue('bucket_quota_max_objects', quotaData.bucket_quota?.max_objects ?? 0);
    }
  }, [quotaData, form]);

  const onSubmit = async (data: UserFormData) => {
    try {
      const maxBuckets = data.max_buckets_mode === '-1' ? -1 : data.max_buckets_mode === '0' ? 0 : data.max_buckets;

      if (isEdit) {
        await updateUser.mutateAsync({
          uid: data.uid,
          display_name: data.display_name,
          email: data.email || undefined,
          max_buckets: maxBuckets,
          suspended: data.suspended,
        });
      } else {
        await createUser.mutateAsync({
          uid: data.uid,
          display_name: data.display_name,
          email: data.email || undefined,
          max_buckets: maxBuckets,
          suspended: data.suspended,
        });
      }

      // Set quotas if enabled
      if (data.user_quota_enabled) {
        const maxSizeKb = data.user_quota_max_size_unlimited ? 0 : Math.floor(parseSize(data.user_quota_max_size) / 1024);
        const maxObjects = data.user_quota_max_objects_unlimited ? 0 : data.user_quota_max_objects;
        await setQuota.mutateAsync({
          uid: data.uid,
          quota_type: 'user',
          enabled: true,
          max_size_kb: maxSizeKb,
          max_objects: maxObjects,
        });
      }
      if (data.bucket_quota_enabled) {
        const maxSizeKb = data.bucket_quota_max_size_unlimited ? 0 : Math.floor(parseSize(data.bucket_quota_max_size) / 1024);
        const maxObjects = data.bucket_quota_max_objects_unlimited ? 0 : data.bucket_quota_max_objects;
        await setQuota.mutateAsync({
          uid: data.uid,
          quota_type: 'bucket',
          enabled: true,
          max_size_kb: maxSizeKb,
          max_objects: maxObjects,
        });
      }

      toast.success(isEdit ? 'User updated' : 'User created');
      onSuccess();
    } catch {
      toast.error(isEdit ? 'Failed to update user' : 'Failed to create user');
    }
  };

  const isPending = createUser.isPending || updateUser.isPending || setQuota.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="uid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input {...field} disabled={isEdit} className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
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
                <Input {...field} type="email" placeholder="user@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="max_buckets_mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Buckets</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="-1">Disabled</SelectItem>
                    <SelectItem value="0">Unlimited</SelectItem>
                    <SelectItem value="1">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {form.watch('max_buckets_mode') === '1' && (
            <FormField
              control={form.control}
              name="max_buckets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bucket Limit</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="suspended"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Suspended</FormLabel>
            </FormItem>
          )}
        />

        {!isEdit && (
          <>
            <FormField
              control={form.control}
              name="generate_key"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Generate Key</FormLabel>
                </FormItem>
              )}
            />

            {!form.watch('generate_key') && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="access_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Key</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secret_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </>
        )}

        {/* User Quota */}
        <div className="border rounded p-3 space-y-3">
          <h4 className="text-sm font-medium">User Quota</h4>
          <FormField
            control={form.control}
            name="user_quota_enabled"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Enabled</FormLabel>
              </FormItem>
            )}
          />
          {form.watch('user_quota_enabled') && (
            <div className="space-y-3 pl-4">
              <div className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="user_quota_max_size_unlimited"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 text-xs">Unlimited Size</FormLabel>
                    </FormItem>
                  )}
                />
                {!form.watch('user_quota_max_size_unlimited') && (
                  <FormField
                    control={form.control}
                    name="user_quota_max_size"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Max Size (e.g. 10G)</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8 text-xs font-mono" placeholder="10G" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <div className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="user_quota_max_objects_unlimited"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 text-xs">Unlimited Objects</FormLabel>
                    </FormItem>
                  )}
                />
                {!form.watch('user_quota_max_objects_unlimited') && (
                  <FormField
                    control={form.control}
                    name="user_quota_max_objects"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Max Objects</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0} className="h-8 text-xs" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bucket Quota */}
        <div className="border rounded p-3 space-y-3">
          <h4 className="text-sm font-medium">Bucket Quota</h4>
          <FormField
            control={form.control}
            name="bucket_quota_enabled"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Enabled</FormLabel>
              </FormItem>
            )}
          />
          {form.watch('bucket_quota_enabled') && (
            <div className="space-y-3 pl-4">
              <div className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="bucket_quota_max_size_unlimited"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 text-xs">Unlimited Size</FormLabel>
                    </FormItem>
                  )}
                />
                {!form.watch('bucket_quota_max_size_unlimited') && (
                  <FormField
                    control={form.control}
                    name="bucket_quota_max_size"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Max Size (e.g. 10G)</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8 text-xs font-mono" placeholder="10G" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <div className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name="bucket_quota_max_objects_unlimited"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 text-xs">Unlimited Objects</FormLabel>
                    </FormItem>
                  )}
                />
                {!form.watch('bucket_quota_max_objects_unlimited') && (
                  <FormField
                    control={form.control}
                    name="bucket_quota_max_objects"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Max Objects</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0} className="h-8 text-xs" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit-mode sub-resources */}
        {isEdit && initialData && (
          <>
            {initialData.subusers?.length ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Subusers ({initialData.subusers.length})</h4>
                <div className="space-y-1">
                  {initialData.subusers.map((su) => (
                    <div key={su.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <span className="font-mono">{su.id}</span>
                      <Badge variant="outline" className="text-xs">{su.permissions}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {initialData.keys?.length ? (
              <div>
                <h4 className="text-sm font-medium mb-2">S3 Keys ({initialData.keys.length})</h4>
                <div className="space-y-1">
                  {initialData.keys.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <span className="font-mono text-xs">{k.access_key}</span>
                      <Badge variant="outline" className="text-xs">S3</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {initialData.caps?.length ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Capabilities ({initialData.caps.length})</h4>
                <div className="space-y-1">
                  {initialData.caps.map((cap, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded">
                      <Badge variant="outline">{cap.type}: {cap.perm}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
