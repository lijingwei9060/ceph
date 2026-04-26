import { useCreateNfsExport, useUpdateNfsExport, useNfsClusters, useNfsFsals, useNfsFilesystems, type NfsExport } from '../api/use-nfs';
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
import { Plus, X } from 'lucide-react';
import { useEffect } from 'react';

const nfsExportSchema = z.object({
  cluster_id: z.string().min(1, 'Cluster is required'),
  fsal_name: z.string().min(1, 'FSAL is required'),
  fs_name: z.string().optional(),
  path: z.string().min(1, 'Path is required'),
  pseudo: z.string().min(1, 'Pseudo path is required'),
  access_type: z.string().default('RW'),
  squash: z.string().default('none'),
  security_label: z.boolean().default(false),
  sec_label_xattr: z.string().default('security.selinux'),
  protocol_nfsv4: z.boolean().default(true),
  protocol_nfsv3: z.boolean().default(false),
  transport_tcp: z.boolean().default(true),
  transport_udp: z.boolean().default(false),
  clients: z.array(z.object({
    addresses: z.string().min(1, 'Address is required'),
    access_type: z.string().default(''),
    squash: z.string().default(''),
  })).default([]),
});

type NfsExportForm = z.infer<typeof nfsExportSchema>;

export function NfsExportForm({
  initialData,
  onSuccess,
}: {
  initialData?: NfsExport;
  onSuccess: () => void;
}) {
  const isEdit = !!initialData;
  const createExport = useCreateNfsExport();
  const updateExport = useUpdateNfsExport();
  const { data: clusters } = useNfsClusters();
  const { data: fsals } = useNfsFsals();
  const { data: filesystems } = useNfsFilesystems();

  const form = useForm<NfsExportForm>({
    resolver: zodResolver(nfsExportSchema),
    defaultValues: {
      cluster_id: initialData?.cluster_id ?? '',
      fsal_name: initialData?.fsal?.name ?? 'CEPH',
      fs_name: initialData?.fsal?.fs_name ?? '',
      path: initialData?.path ?? '/',
      pseudo: initialData?.pseudo ?? '/',
      access_type: initialData?.access_type ?? 'RW',
      squash: initialData?.squash ?? 'none',
      security_label: initialData?.security_label ?? false,
      sec_label_xattr: initialData?.fsal?.sec_label_xattr ?? 'security.selinux',
      protocol_nfsv4: initialData?.protocols?.includes('4') ?? true,
      protocol_nfsv3: initialData?.protocols?.includes('3') ?? false,
      transport_tcp: initialData?.transports?.includes('TCP') ?? true,
      transport_udp: initialData?.transports?.includes('UDP') ?? false,
      clients: initialData?.clients?.map((c) => ({
        addresses: c.addresses.join(', '),
        access_type: c.access_type,
        squash: c.squash,
      })) ?? [],
    },
  });

  const fsalName = form.watch('fsal_name');
  const pathValue = form.watch('path');

  // Auto-generate pseudo from path
  useEffect(() => {
    if (!isEdit && pathValue && pathValue.startsWith('/')) {
      form.setValue('pseudo', pathValue);
    }
  }, [pathValue, isEdit, form]);

  const onSubmit = async (data: NfsExportForm) => {
    const protocols: string[] = [];
    if (data.protocol_nfsv4) protocols.push('4');
    if (data.protocol_nfsv3) protocols.push('3');
    const transports: string[] = [];
    if (data.transport_tcp) transports.push('TCP');
    if (data.transport_udp) transports.push('UDP');

    const exportData: NfsExport = {
      export_id: initialData?.export_id ?? 0,
      path: data.path,
      cluster_id: data.cluster_id,
      pseudo: data.pseudo,
      access_type: data.access_type,
      squash: data.squash,
      security_label: data.security_label,
      protocols,
      transports,
      fsal: {
        name: data.fsal_name,
        ...(data.fsal_name === 'CEPH' && data.fs_name ? { fs_name: data.fs_name } : {}),
        ...(data.fsal_name === 'CEPH' && data.security_label ? { sec_label_xattr: data.sec_label_xattr } : {}),
        ...(data.fsal_name === 'CEPH' ? { user_id: 'nfs.${cluster_id}' } : {}),
      },
      clients: data.clients.filter((c) => c.addresses.trim()).map((c) => ({
        addresses: c.addresses.split(',').map((a) => a.trim()).filter(Boolean),
        access_type: c.access_type || data.access_type,
        squash: c.squash || data.squash,
      })),
    };

    try {
      if (isEdit) {
        await updateExport.mutateAsync(exportData);
        toast.success('NFS export updated');
      } else {
        await createExport.mutateAsync(exportData);
        toast.success('NFS export created');
      }
      onSuccess();
    } catch {
      toast.error(isEdit ? 'Failed to update NFS export' : 'Failed to create NFS export');
    }
  };

  const isPending = createExport.isPending || updateExport.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="cluster_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cluster</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cluster" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clusters?.map((c) => (
                    <SelectItem key={c.cluster_id} value={c.cluster_id}>{c.cluster_id}</SelectItem>
                  ))}
                  {(!clusters?.length) && <SelectItem value={field.value || '_manual'}>{field.value || 'Enter manually below'}</SelectItem>}
                </SelectContent>
              </Select>
              {(!clusters?.length) && (
                <Input className="mt-1" placeholder="Type cluster ID" value={field.value} onChange={field.onChange} disabled={isEdit} />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fsal_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage Backend</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select backend" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fsals?.filter((f) => f.available).map((f) => (
                    <SelectItem key={f.name} value={f.name}>{f.name === 'CEPH' ? 'CephFS' : f.name === 'RGW' ? 'Object Gateway' : f.name}</SelectItem>
                  ))}
                  {(!fsals?.length) && (
                    <>
                      <SelectItem value="CEPH">CephFS</SelectItem>
                      <SelectItem value="RGW">Object Gateway</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {fsalName === 'CEPH' && (
          <FormField
            control={form.control}
            name="fs_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volume</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select filesystem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filesystems?.map((fs) => (
                      <SelectItem key={fs.name} value={fs.name}>{fs.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {fsalName === 'CEPH' && (
          <FormField
            control={form.control}
            name="security_label"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Security Label</FormLabel>
              </FormItem>
            )}
          />
        )}

        {fsalName === 'CEPH' && form.watch('security_label') && (
          <FormField
            control={form.control}
            name="sec_label_xattr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Label Xattr</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fsalName === 'RGW' ? 'Bucket' : 'Path'}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={fsalName === 'RGW' ? 'bucket-name' : '/'} className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pseudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pseudo Path</FormLabel>
              <FormControl>
                <Input {...field} placeholder="/" className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="access_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RW">Read/Write</SelectItem>
                    <SelectItem value="RO">Read Only</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="squash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Squash</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Root Squash</SelectItem>
                    <SelectItem value="root_id">Root ID Squash</SelectItem>
                    <SelectItem value="root">Root Squash</SelectItem>
                    <SelectItem value="all">All Squash</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel className="text-sm">NFS Protocol</FormLabel>
            <div className="flex gap-4 mt-1">
              <FormField
                control={form.control}
                name="protocol_nfsv4"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 text-xs">NFSv4</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="protocol_nfsv3"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 text-xs">NFSv3</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div>
            <FormLabel className="text-sm">Transport</FormLabel>
            <div className="flex gap-4 mt-1">
              <FormField
                control={form.control}
                name="transport_tcp"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 text-xs">TCP</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transport_udp"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 text-xs">UDP</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Clients sub-form */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <FormLabel className="text-sm">Clients</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => form.setValue('clients', [...(form.getValues('clients') ?? []), { addresses: '', access_type: '', squash: '' }])}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Client
            </Button>
          </div>
          {(form.watch('clients') ?? []).map((_, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-2 p-2 bg-muted/50 rounded">
              <div className="flex-1 space-y-2">
                <FormField
                  control={form.control}
                  name={`clients.${idx}.addresses`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input className="h-7 text-xs" placeholder="IP/CIDR (comma-separated)" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`clients.${idx}.access_type`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Access (inherit)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RW">RW</SelectItem>
                            <SelectItem value="RO">RO</SelectItem>
                            <SelectItem value="NONE">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`clients.${idx}.squash`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Squash (inherit)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="root">Root</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 mt-1"
                onClick={() => {
                  const clients = [...(form.getValues('clients') ?? [])];
                  clients.splice(idx, 1);
                  form.setValue('clients', clients);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {!(form.watch('clients') ?? []).length && (
            <p className="text-xs text-muted-foreground">No client restrictions — all clients can access</p>
          )}
        </div>

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
