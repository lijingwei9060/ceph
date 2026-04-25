import { useCreateNfsExport } from '../api/use-nfs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { toast } from 'sonner';

const nfsExportSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  cluster_id: z.string().min(1, 'Cluster ID is required'),
  pseudo: z.string().min(1, 'Pseudo path is required'),
  access_type: z.string().default('RW'),
  squash: z.string().default('none'),
  fsal_name: z.string().default('CEPH'),
});

type NfsExportForm = z.infer<typeof nfsExportSchema>;

export function NfsExportForm({ onSuccess }: { onSuccess: () => void }) {
  const createExport = useCreateNfsExport();
  const form = useForm<NfsExportForm>({
    resolver: zodResolver(nfsExportSchema),
    defaultValues: {
      path: '/',
      cluster_id: '',
      pseudo: '/',
      access_type: 'RW',
      squash: 'none',
      fsal_name: 'CEPH',
    },
  });

  const onSubmit = async (data: NfsExportForm) => {
    try {
      await createExport.mutateAsync({
        path: data.path,
        cluster_id: data.cluster_id,
        pseudo: data.pseudo,
        access_type: data.access_type,
        squash: data.squash,
        security_label: false,
        protocols: ['4'],
        transports: ['TCP'],
        fsal: { name: data.fsal_name },
      });
      toast.success('NFS export created');
      onSuccess();
    } catch {
      toast.error('Failed to create NFS export');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="cluster_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cluster ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="cephfs" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Path</FormLabel>
              <FormControl>
                <Input {...field} placeholder="/" className="font-mono" />
              </FormControl>
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
            </FormItem>
          )}
        />
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
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="root">Root</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fsal_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>FSAL</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CEPH">Ceph</SelectItem>
                  <SelectItem value="RGW">RGW</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={createExport.isPending}>
            {createExport.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
