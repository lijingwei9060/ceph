import { z } from 'zod/v4';

export const permissionSchema = z.object({
  read: z.boolean(),
  create: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
});

export const loginResponseSchema = z.object({
  username: z.string(),
  permissions: z.record(z.string(), z.array(z.string())),
  pwdExpirationDate: z.number(),
  sso: z.boolean(),
  pwdUpdateRequired: z.boolean(),
});

export const authCheckResponseSchema = z.object({
  login_url: z.string().optional(),
  username: z.string().optional(),
  permissions: z.record(z.string(), z.array(z.string())).optional(),
  sso: z.boolean().optional(),
  pwdExpirationDate: z.number().optional(),
  pwdUpdateRequired: z.boolean().optional(),
});

export const summarySchema = z.object({
  executing_tasks: z.array(z.unknown()).optional(),
  filesystems: z.array(z.unknown()).optional(),
  finished_tasks: z.array(z.unknown()).optional(),
  have_mon_connection: z.boolean().optional(),
  health_status: z.string().optional(),
  mgr_host: z.string().optional(),
  mgr_id: z.string().optional(),
  rbd_mirroring: z.unknown().optional(),
  rbd_pools: z.array(z.unknown()).optional(),
  version: z.string().optional(),
});

export const featureTogglesSchema = z.object({
  rbd: z.boolean(),
  mirroring: z.boolean(),
  iscsi: z.boolean(),
  cephfs: z.boolean(),
  rgw: z.boolean(),
  nfs: z.boolean(),
});

export const hostSchema = z.object({
  hostname: z.string(),
  addresses: z.array(z.string()),
  labels: z.array(z.string()),
  status: z.string(),
  source: z.number(),
  seq_run: z.number(),
  cpu: z.string().optional(),
  kernel: z.string().optional(),
  mem: z.number().optional(),
  mem_avail: z.number().optional(),
  osds: z.number().optional(),
});

export const osdSchema = z.object({
  osd: z.number(),
  uuid: z.string(),
  up: z.boolean(),
  in: z.boolean(),
  weight: z.number(),
  crush_weight: z.number(),
  host: z.string().optional(),
  device_class: z.string().optional(),
  state: z.array(z.string()).optional(),
});
