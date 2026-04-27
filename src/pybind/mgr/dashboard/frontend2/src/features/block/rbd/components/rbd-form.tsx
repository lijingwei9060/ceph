import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateRbd, useUpdateRbd, type RbdImage } from '../api/use-rbd';
import { toast } from 'sonner';

const rbdFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pool_name: z.string().min(1, 'Pool is required'),
  size: z.string().min(1, 'Size is required'),
  require_mirroring: z.boolean().optional(),
});

type RbdFormData = z.infer<typeof rbdFormSchema>;

const FEATURE_OPTIONS = [
  'layering',
  'striping',
  'exclusive-lock',
  'object-map',
  'fast-diff',
  'deep-flatten',
  'journaling',
  'data-pool',
];

interface RbdFormProps {
  initialData?: RbdImage;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RbdForm({ initialData, onSuccess, onCancel }: RbdFormProps) {
  const createRbd = useCreateRbd();
  const updateRbd = useUpdateRbd();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(initialData?.features || ['layering'])
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RbdFormData>({
    resolver: zodResolver(rbdFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      pool_name: initialData?.pool_name ?? '',
      size: initialData?.size ? String(initialData.size) : '',
      require_mirroring: false,
    },
  });

  const toggleFeature = (feature: string) => {
    const next = new Set(selectedFeatures);
    if (next.has(feature)) {
      next.delete(feature);
    } else {
      next.add(feature);
    }
    setSelectedFeatures(next);
  };

  const parseSize = (sizeStr: string): number => {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B?)$/i);
    if (!match) return parseInt(sizeStr) || 0;
    const [, value, unit] = match;
    const num = parseFloat(value);
    const u = unit.toUpperCase().replace('B', '');
    const multipliers: Record<string, number> = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 };
    return Math.floor(num * (multipliers[u] || 1));
  };

  const onSubmit = async (data: RbdFormData) => {
    setIsSubmitting(true);
    try {
      const sizeBytes = parseSize(data.size);
      if (initialData) {
        await updateRbd.mutateAsync({
          poolName: initialData.pool_name,
          imageName: initialData.name,
          size: sizeBytes,
          features: [...selectedFeatures],
        });
        toast.success('RBD image updated');
      } else {
        await createRbd.mutateAsync({
          ...data,
          size: sizeBytes,
          features: [...selectedFeatures],
        });
        toast.success('RBD image created');
      }
      onSuccess();
    } catch {
      toast.error(initialData ? 'Failed to update RBD' : 'Failed to create RBD');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Image Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g., my-image" />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="pool_name">Pool</Label>
        <Input id="pool_name" {...register('pool_name')} placeholder="e.g., rbd" />
        {errors.pool_name && (
          <p className="text-xs text-destructive">{errors.pool_name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="size">Size</Label>
        <Input id="size" {...register('size')} placeholder="e.g., 10G, 1T" />
        {errors.size && (
          <p className="text-xs text-destructive">{errors.size.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Features</Label>
        <div className="grid grid-cols-2 gap-2">
          {FEATURE_OPTIONS.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <Checkbox
                id={`feature-${feature}`}
                checked={selectedFeatures.has(feature)}
                onCheckedChange={() => toggleFeature(feature)}
              />
              <Label htmlFor={`feature-${feature}`} className="text-sm font-normal cursor-pointer">
                {feature}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="require_mirroring" {...register('require_mirroring')} />
        <Label htmlFor="require_mirroring" className="text-sm font-normal cursor-pointer">
          Require Mirroring
        </Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
