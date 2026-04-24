import { useCreatePool } from '../api/use-pool';
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

const poolCreateSchema = z.object({
  pool: z.string().min(1, 'Pool name is required'),
  pool_type: z.string().default('replicated'),
  pg_num: z.coerce.number().min(1).default(32),
  size: z.coerce.number().min(1).default(3),
  application: z.string().optional(),
});

type PoolCreateForm = z.infer<typeof poolCreateSchema>;

export function PoolCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const createPool = useCreatePool();
  const form = useForm<PoolCreateForm>({
    resolver: zodResolver(poolCreateSchema),
    defaultValues: {
      pool: '',
      pool_type: 'replicated',
      pg_num: 32,
      size: 3,
      application: '',
    },
  });

  const onSubmit = async (data: PoolCreateForm) => {
    try {
      const payload: Record<string, unknown> = {
        pool: data.pool,
        pool_type: data.pool_type,
        pg_num: data.pg_num,
      };
      if (data.pool_type === 'replicated') {
        payload.size = data.size;
      }
      if (data.application) {
        payload.application = data.application;
      }
      await createPool.mutateAsync(payload as Parameters<typeof createPool.mutateAsync>[0]);
      toast.success(`Pool ${data.pool} created`);
      onSuccess();
    } catch {
      toast.error('Failed to create pool');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="pool"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pool Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="my-pool" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pool_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="replicated">Replicated</SelectItem>
                  <SelectItem value="erasure">Erasure Coded</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pg_num"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PG Num</FormLabel>
              <FormControl>
                <Input {...field} type="number" min={1} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('pool_type') === 'replicated' && (
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Replicated Size</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={1} max={10} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="application"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="rbd, cephfs, rgw" />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createPool.isPending}>
            {createPool.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
