import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreatePool,
  useUpdatePool,
  usePoolInfo,
  type Pool,
} from '../api/use-pool';
import {
  useErasureCodeProfiles,
  useCreateErasureCodeProfile,
} from '../api/use-ec-profile';
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
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { calculatePgNumReplicated, calculatePgNumErasure } from './pg-calculator';

/** Map human-readable pool_type to the integer the backend expects */
const POOL_TYPE_MAP: Record<string, number> = { replicated: 1, erasure: 3 };

const poolFormSchema = z.object({
  pool: z.string().min(1, 'Pool name is required').regex(/^[.A-Za-z0-9_/-]+$/, 'Invalid characters'),
  pool_type: z.enum(['replicated', 'erasure']).default('replicated'),
  pg_autoscale_mode: z.string().default('on'),
  pg_num: z.coerce.number().min(1).default(32),
  size: z.coerce.number().min(1).max(10).default(3),
  erasure_code_profile: z.string().optional(),
  crush_rule: z.string().optional(),
  ec_overwrites: z.boolean().default(false),
  compression_mode: z.string().default('none'),
  compression_algorithm: z.string().optional(),
  compression_min_blob_size: z.string().optional(),
  compression_max_blob_size: z.string().optional(),
  compression_ratio: z.string().optional(),
  quota_max_bytes: z.string().optional(),
  quota_max_objects: z.coerce.number().min(0).default(0),
  application_metadata: z.array(z.string()).default([]),
});

type PoolFormData = z.infer<typeof poolFormSchema>;

const APPLICATIONS = ['cephfs', 'rbd', 'rgw'];

function parseBinarySize(input: string): number {
  if (!input) return 0;
  const match = input.match(/^(\d+(?:\.\d+)?)\s*([KMGTPE]?)B?$/i);
  if (!match) return parseInt(input, 10) || 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const m: Record<string, number> = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4, P: 1024 ** 5, E: 1024 ** 6 };
  return Math.floor(num * (m[unit] ?? 1));
}

export function PoolForm({
  initialData,
  onSuccess,
}: {
  initialData?: Pool;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createPool = useCreatePool();
  const updatePool = useUpdatePool();
  const { data: info } = usePoolInfo();
  const { data: ecProfiles } = useErasureCodeProfiles();
  const [showEcForm, setShowEcForm] = useState(false);

  const form = useForm<PoolFormData>({
    resolver: zodResolver(poolFormSchema),
    defaultValues: {
      pool: initialData?.pool_name ?? '',
      pool_type: (initialData?.type as 'replicated' | 'erasure') ?? 'replicated',
      pg_autoscale_mode: initialData?.pg_autoscale_mode ?? info?.pg_autoscale_default_mode ?? 'on',
      pg_num: initialData?.pg_num ?? 32,
      size: initialData?.size ?? 3,
      erasure_code_profile: initialData?.erasure_code_profile ?? '',
      crush_rule: initialData?.crush_rule ?? '',
      ec_overwrites: initialData?.flags_names?.includes('ec_overwrites') ?? false,
      compression_mode: initialData?.compression_mode ?? 'none',
      compression_algorithm: initialData?.compression_algorithm ?? '',
      compression_min_blob_size: initialData?.compression_min_blob_size ? String(initialData.compression_min_blob_size) : '',
      compression_max_blob_size: initialData?.compression_max_blob_size ? String(initialData.compression_max_blob_size) : '',
      compression_ratio: initialData?.compression_ratio ? String(initialData.compression_ratio) : '',
      quota_max_bytes: initialData?.quota_max_bytes ? String(initialData.quota_max_bytes) : '',
      quota_max_objects: initialData?.quota_max_objects ?? 0,
      application_metadata: initialData?.application_metadata ?? [],
    },
  });

  const poolType = form.watch('pool_type');
  const size = form.watch('size');
  const ecProfileName = form.watch('erasure_code_profile');
  const pgAutoscaleMode = form.watch('pg_autoscale_mode');
  const compressionMode = form.watch('compression_mode');

  // PG calculator: auto-calculate when pool_type, size, or ec_profile changes
  useEffect(() => {
    if (isEdit || !info) return;
    let pgNum = 32;
    if (poolType === 'replicated' && size > 0) {
      pgNum = calculatePgNumReplicated(info.osd_count, size);
    } else if (poolType === 'erasure' && ecProfileName) {
      const profile = ecProfiles?.find((p) => p.name === ecProfileName);
      if (profile) {
        pgNum = calculatePgNumErasure(info.osd_count, profile.k, profile.m);
      }
    }
    form.setValue('pg_num', pgNum, { shouldDirty: false });
  }, [poolType, size, ecProfileName, info, ecProfiles, isEdit, form]);

  const onSubmit = async (data: PoolFormData) => {
    try {
      const payload: Record<string, unknown> = {
        pool: data.pool,
        pool_type: POOL_TYPE_MAP[data.pool_type] ?? 1,
        pg_num: data.pg_autoscale_mode === 'on' ? 1 : data.pg_num,
        pg_autoscale_mode: data.pg_autoscale_mode,
      };

      if (data.pool_type === 'replicated') {
        payload.size = data.size;
      }
      if (data.pool_type === 'erasure' && data.erasure_code_profile) {
        payload.erasure_code_profile = data.erasure_code_profile;
      }
      if (data.crush_rule) {
        payload.rule_name = data.crush_rule;
      }
      if (data.pool_type === 'erasure' && data.ec_overwrites) {
        payload.flags = ['ec_overwrites'];
      }
      if (data.application_metadata?.length) {
        payload.application_metadata = data.application_metadata;
      }

      // Compression
      if (info?.is_all_bluestore && data.compression_mode && data.compression_mode !== 'none') {
        payload.compression_mode = data.compression_mode;
        if (data.compression_algorithm) payload.compression_algorithm = data.compression_algorithm;
        if (data.compression_min_blob_size) payload.compression_min_blob_size = parseBinarySize(data.compression_min_blob_size);
        if (data.compression_max_blob_size) payload.compression_max_blob_size = parseBinarySize(data.compression_max_blob_size);
        if (data.compression_ratio) payload.compression_required_ratio = parseFloat(data.compression_ratio);
      } else if (info?.is_all_bluestore && isEdit && data.compression_mode === 'none') {
        payload.compression_mode = 'unset';
      }

      // Quotas
      if (data.quota_max_bytes) {
        payload.quota_max_bytes = parseBinarySize(data.quota_max_bytes);
      }
      if (data.quota_max_objects > 0) {
        payload.quota_max_objects = data.quota_max_objects;
      }

      if (isEdit) {
        await updatePool.mutateAsync({ poolName: initialData!.pool_name, ...payload });
        toast.success(t('messages.success'));
      } else {
        await createPool.mutateAsync(payload);
        toast.success(t('messages.success'));
      }
      onSuccess();
    } catch {
      toast.error(isEdit ? t('messages.error') : t('messages.error'));
    }
  };

  const isPending = createPool.isPending || updatePool.isPending;
  const crushRules = poolType === 'replicated' ? info?.crush_rules_replicated : info?.crush_rules_erasure;
  const ecProfile = ecProfiles?.find((p) => p.name === ecProfileName);
  const hasCompression = info?.is_all_bluestore && compressionMode && compressionMode !== 'none';

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="pool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pools.name')}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isEdit} className="font-mono" placeholder="my-pool" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pool_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pools.type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="replicated">{t('pools.replicated')}</SelectItem>
                      <SelectItem value="erasure">{t('pools.erasureCoded')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pg_autoscale_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pools.pgAutoscaleMode')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(info?.pg_autoscale_modes ?? ['on', 'off', 'warn']).map((mode) => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {pgAutoscaleMode !== 'on' && (
            <FormField
              control={form.control}
              name="pg_num"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pools.pgNum')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t('pools.pgCalculated')}: {poolType === 'replicated'
                      ? calculatePgNumReplicated(info?.osd_count ?? 0, size)
                      : ecProfile ? calculatePgNumErasure(info?.osd_count ?? 0, ecProfile.k, ecProfile.m) : '-'
                    } PGs (OSD: {info?.osd_count ?? '?'})
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="crush_rule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pools.crushRule')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {crushRules?.map((rule) => (
                      <SelectItem key={rule.rule_name} value={rule.rule_name}>{rule.rule_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {poolType === 'replicated' && (
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pools.replicatedSize')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} max={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {poolType === 'erasure' && (
            <>
              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name="erasure_code_profile"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('pools.ecProfile')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ecProfiles?.map((p) => (
                            <SelectItem key={p.name} value={p.name}>
                              {p.name} (k={p.k}, m={p.m})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isEdit && (
                  <Button type="button" variant="outline" size="sm" className="mb-5" onClick={() => setShowEcForm(true)}>
                    <Plus className="h-4 w-4 mr-1" /> {t('common.create')}
                  </Button>
                )}
              </div>

              {ecProfile && (
                <div className="p-2 bg-muted/50 rounded text-xs space-y-1">
                  <p>Plugin: <strong>{ecProfile.plugin}</strong>, Technique: <strong>{ecProfile.technique}</strong></p>
                  <p>Data chunks (k): <strong>{ecProfile.k}</strong>, Coding chunks (m): <strong>{ecProfile.m}</strong></p>
                  {ecProfile['crush-failure-domain'] && <p>Failure domain: <strong>{ecProfile['crush-failure-domain']}</strong></p>}
                </div>
              )}

              {info?.is_all_bluestore && (
                <FormField
                  control={form.control}
                  name="ec_overwrites"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">{t('pools.ecOverwrites')}</FormLabel>
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          {info?.is_all_bluestore && (
            <div className="border rounded p-3 space-y-3">
              <h4 className="text-sm font-medium">{t('pools.compression')}</h4>
              <FormField
                control={form.control}
                name="compression_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pools.compressionMode')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(info.compression_modes ?? ['none', 'passive', 'aggressive', 'force']).map((mode) => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {hasCompression && (
                <div className="space-y-3 pl-2">
                  <FormField
                    control={form.control}
                    name="compression_algorithm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pools.compressionAlgorithm')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(info.compression_algorithms ?? ['lz4', 'snappy', 'zlib', 'zstd']).map((a) => (
                              <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="compression_min_blob_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('pools.compressionMinBlobSize')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-8 text-xs font-mono" placeholder="e.g. 128KiB" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="compression_max_blob_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('pools.compressionMaxBlobSize')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-8 text-xs font-mono" placeholder="e.g. 512KiB" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="compression_ratio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{t('pools.compressionRatio')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0} max={1} step={0.1} className="h-8 text-xs" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          )}

          <div className="border rounded p-3 space-y-3">
            <h4 className="text-sm font-medium">{t('pools.quota')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quota_max_bytes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pools.quotaMaxBytes')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono text-xs" placeholder="e.g. 10GiB" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quota_max_objects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pools.quotaMaxObjects')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t('pools.applications')}</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {APPLICATIONS.map((app) => {
                const selected = form.watch('application_metadata')?.includes(app) ?? false;
                return (
                  <Badge
                    key={app}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = form.getValues('application_metadata') ?? [];
                      const next = selected ? current.filter((a) => a !== app) : [...current, app];
                      form.setValue('application_metadata', next);
                    }}
                  >
                    {app}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onSuccess}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.loading') : (isEdit ? t('common.save') : t('common.create'))}
            </Button>
          </div>
        </form>
      </Form>

      <EcProfileCreateDialog
        open={showEcForm}
        onClose={() => setShowEcForm(false)}
        onCreated={(name) => {
          form.setValue('erasure_code_profile', name);
          setShowEcForm(false);
        }}
      />
    </>
  );
}

// --- EC Profile Create Dialog ---

const PLUGIN_DEFAULTS: Record<string, { k: number; m: number; technique: string }> = {
  jerasure: { k: 4, m: 2, technique: 'reed_sol_van' },
  lrc: { k: 4, m: 2, technique: '' },
  isa: { k: 7, m: 3, technique: 'reed_sol_van' },
  shec: { k: 4, m: 3, technique: '' },
  clay: { k: 4, m: 2, technique: '' },
};

const EC_TECHNIQUES: Record<string, string[]> = {
  jerasure: ['reed_sol_van', 'cauchy_good', 'liberation', 'blaum_roth', 'cauchy_orig'],
  isa: ['reed_sol_van', 'cauchy'],
  clay: ['isa_lrc', 'jerasure'],
};

function EcProfileCreateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const { t } = useTranslation();
  const createEcProfile = useCreateErasureCodeProfile();
  const [name, setName] = useState('');
  const [plugin, setPlugin] = useState('jerasure');
  const [k, setK] = useState(4);
  const [m, setM] = useState(2);
  const [technique, setTechnique] = useState('reed_sol_van');

  const handlePluginChange = (newPlugin: string) => {
    setPlugin(newPlugin);
    const defaults = PLUGIN_DEFAULTS[newPlugin];
    if (defaults) {
      setK(defaults.k);
      setM(defaults.m);
      setTechnique(defaults.technique);
    }
  };

  const handleCreate = async () => {
    if (!name) return;
    try {
      const data: Record<string, unknown> = { name, k, m, plugin };
      if (technique) data.technique = technique;
      await createEcProfile.mutateAsync(data);
      toast.success(t('messages.success'));
      onCreated(name);
      setName('');
    } catch {
      toast.error(t('messages.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pools.createEcProfile')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('pools.ecProfileName')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-ec-profile" className="font-mono" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plugin</label>
              <Select value={plugin} onValueChange={handlePluginChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['jerasure', 'lrc', 'isa', 'shec', 'clay'].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('pools.ecK')}</label>
              <Input type="number" min={2} value={k} onChange={(e) => setK(parseInt(e.target.value) || 2)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('pools.ecM')}</label>
              <Input type="number" min={1} value={m} onChange={(e) => setM(parseInt(e.target.value) || 1)} />
            </div>
          </div>

          {EC_TECHNIQUES[plugin] && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Technique</label>
              <Select value={technique} onValueChange={setTechnique}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EC_TECHNIQUES[plugin].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={createEcProfile.isPending || !name}>
              {createEcProfile.isPending ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
