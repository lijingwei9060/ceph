import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useSilence,
  useCreateSilence,
  useAlertmanagerAlerts,
  usePrometheusSilences,
} from '../../api/use-prometheus';
import type {
  AlertmanagerSilence,
  AlertmanagerSilenceMatcher,
} from '../../api/use-prometheus';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

const silenceFormSchema = z.object({
  createdBy: z.string().min(1, '创建者不能为空'),
  comment: z.string().min(1, '备注不能为空'),
  startsAt: z.string().min(1, '开始时间不能为空'),
  endsAt: z.string().min(1, '结束时间不能为空'),
  duration: z.string().optional(),
});

type SilenceFormValues = z.infer<typeof silenceFormSchema>;

const DURATION_OPTIONS = [
  { label: '1 小时', value: '1h' },
  { label: '2 小时', value: '2h' },
  { label: '4 小时', value: '4h' },
  { label: '8 小时', value: '8h' },
  { label: '12 小时', value: '12h' },
  { label: '24 小时', value: '24h' },
  { label: '48 小时', value: '48h' },
  { label: '1 周', value: '168h' },
];

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([hdm])$/);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return 0;
  }
}

function formatDateTimeForInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function addDuration(date: Date, durationMs: number): Date {
  return new Date(date.getTime() + durationMs);
}

interface MatcherRowProps {
  matcher: AlertmanagerSilenceMatcher;
  index: number;
  onUpdate: (index: number, matcher: AlertmanagerSilenceMatcher) => void;
  onDelete: (index: number) => void;
}

function MatcherRow({ matcher, index, onUpdate, onDelete }: MatcherRowProps) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Input
        placeholder="名称"
        value={matcher.name}
        onChange={(e) => onUpdate(index, { ...matcher, name: e.target.value })}
        className="w-32"
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id={`regex-${index}`}
          checked={matcher.isRegex}
          onCheckedChange={(checked) =>
            onUpdate(index, { ...matcher, isRegex: checked as boolean })
          }
        />
        <label htmlFor={`regex-${index}`} className="text-sm text-muted-foreground">
          正则
        </label>
      </div>
      <Input
        placeholder="值"
        value={matcher.value}
        onChange={(e) => onUpdate(index, { ...matcher, value: e.target.value })}
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SilenceFormPage() {
  const navigate = useNavigate();
  const { mode, id } = useParams<{ mode: string; id: string }>();
  const { user } = useAuth();

  const isEdit = mode === 'edit';
  const isRecreate = mode === 'recreate';
  const isCreateFromAlert = mode === 'create' && id;

  const [matchers, setMatchers] = useState<AlertmanagerSilenceMatcher[]>([]);
  const [duration, setDuration] = useState<string>('2h');

  const { data: silences } = usePrometheusSilences();
  const { data: alerts } = useAlertmanagerAlerts();
  const createSilence = useCreateSilence();

  const existingSilence = silences?.find((s) => s.id === id);
  const existingAlert = alerts?.find((a) => a.fingerprint === id);

  const form = useForm<SilenceFormValues>({
    resolver: zodResolver(silenceFormSchema),
    defaultValues: {
      createdBy: user?.username || '',
      comment: '',
      startsAt: formatDateTimeForInput(new Date()),
      endsAt: formatDateTimeForInput(addDuration(new Date(), parseDuration('2h'))),
    },
  });

  useEffect(() => {
    if (isEdit && existingSilence) {
      form.setValue('createdBy', existingSilence.createdBy);
      form.setValue('comment', existingSilence.comment);
      form.setValue('startsAt', formatDateTimeForInput(new Date(existingSilence.startsAt)));
      form.setValue('endsAt', formatDateTimeForInput(new Date(existingSilence.endsAt)));
      setMatchers(existingSilence.matchers);
    } else if (isRecreate && existingSilence) {
      form.setValue('createdBy', existingSilence.createdBy);
      form.setValue('comment', existingSilence.comment);
      setMatchers(existingSilence.matchers);
    } else if (isCreateFromAlert && existingAlert) {
      setMatchers([
        {
          name: 'alertname',
          value: existingAlert.labels.alertname || '',
          isRegex: false,
        },
      ]);
    }
  }, [isEdit, isRecreate, isCreateFromAlert, existingSilence, existingAlert, form]);

  useEffect(() => {
    const startsAt = form.watch('startsAt');
    if (startsAt && duration) {
      const startDate = new Date(startsAt);
      const durationMs = parseDuration(duration);
      const endDate = addDuration(startDate, durationMs);
      form.setValue('endsAt', formatDateTimeForInput(endDate), { shouldValidate: true });
    }
  }, [form.watch('startsAt'), duration, form]);

  const handleAddMatcher = () => {
    setMatchers([...matchers, { name: '', value: '', isRegex: false }]);
  };

  const handleUpdateMatcher = (index: number, matcher: AlertmanagerSilenceMatcher) => {
    const newMatchers = [...matchers];
    newMatchers[index] = matcher;
    setMatchers(newMatchers);
  };

  const handleDeleteMatcher = (index: number) => {
    setMatchers(matchers.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: SilenceFormValues) => {
    if (matchers.length === 0) {
      form.setError('root', { message: '至少需要添加一个匹配器' });
      return;
    }

    const payload: AlertmanagerSilence = {
      matchers,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      createdBy: values.createdBy,
      comment: values.comment,
    };

    if (isEdit && id) {
      payload.id = id;
    }

    await createSilence.mutateAsync(payload);
    navigate('/monitoring/silences');
  };

  const pageTitle = isEdit ? '编辑静默规则' : isRecreate ? '重建静默规则' : '创建静默规则';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{pageTitle}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">匹配器</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {matchers.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  暂无匹配器，请添加至少一个匹配器
                </div>
              ) : (
                <div className="space-y-2">
                  {matchers.map((matcher, index) => (
                    <MatcherRow
                      key={index}
                      matcher={matcher}
                      index={index}
                      onUpdate={handleUpdateMatcher}
                      onDelete={handleDeleteMatcher}
                    />
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMatcher}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                添加匹配器
              </Button>
              {form.formState.errors.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">时间设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>开始时间</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>持续时间</FormLabel>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择持续时间" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>结束时间</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">其他信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="createdBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>创建者</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button type="submit" disabled={createSilence.isPending}>
              {createSilence.isPending && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              {isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
