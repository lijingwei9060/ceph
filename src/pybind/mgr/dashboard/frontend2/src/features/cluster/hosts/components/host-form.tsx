import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateHost } from '@/features/host/api/use-hosts';
import type { Host } from '@/types';
import { toast } from 'sonner';

const hostFormSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required'),
  addr: z.string().min(1, 'Address is required'),
  labels: z.string().optional(),
});

type HostFormData = z.infer<typeof hostFormSchema>;

interface HostFormProps {
  initialData?: Host;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HostForm({ initialData, onSuccess, onCancel }: HostFormProps) {
  const createHost = useCreateHost();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HostFormData>({
    resolver: zodResolver(hostFormSchema),
    defaultValues: {
      hostname: initialData?.hostname ?? '',
      addr: initialData?.addresses?.[0] ?? '',
      labels: initialData?.labels?.join(', ') ?? '',
    },
  });

  const onSubmit = async (data: HostFormData) => {
    setIsSubmitting(true);
    try {
      const labels = data.labels
        ? data.labels.split(',').map((l) => l.trim()).filter(Boolean)
        : [];
      await createHost.mutateAsync({
        hostname: data.hostname,
        addr: data.addr,
        labels,
      });
      toast.success('Host added successfully');
      onSuccess();
    } catch {
      toast.error('Failed to add host');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hostname">Hostname</Label>
        <Input id="hostname" {...register('hostname')} />
        {errors.hostname && (
          <p className="text-xs text-destructive">{errors.hostname.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="addr">Address</Label>
        <Input id="addr" {...register('addr')} />
        {errors.addr && (
          <p className="text-xs text-destructive">{errors.addr.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="labels">Labels (comma-separated)</Label>
        <Input
          id="labels"
          {...register('labels')}
          placeholder="label1, label2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Host'}
        </Button>
      </div>
    </form>
  );
}
