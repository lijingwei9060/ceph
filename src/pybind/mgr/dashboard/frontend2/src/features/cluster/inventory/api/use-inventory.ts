import { useQuery } from '@tanstack/react-query';
import { uiApiClient, apiClient } from '@/lib/api-client';

export interface InventoryDevice {
  path: string;
  available: boolean;
  rejected_reasons?: string[];
  sys_api?: {
    vendor?: string;
    model?: string;
    rev?: string;
    size?: number;
    human_readable_size?: string;
    rotational?: string;
    partitions?: Record<string, {
      start: string;
      sectors: string;
      sectorsize: number;
      size: string;
      human_readable_size: string;
      holders: string[];
    }>;
    removable?: number;
    ro?: number;
    support_discard?: number;
    nr_requests?: number;
    scheduler_mode?: string;
    locked?: number;
  };
  lvs?: Array<{
    name: string;
    osd_id?: number;
    cluster_name?: string;
    type?: string;
    osd_fsid?: string;
    cluster_fsid?: string;
    block_uuid?: string;
  }>;
  human_readable_type?: string;
  device_id?: string;
  osd_ids?: number[];
}

export interface HostInventory {
  name: string;
  addr: string;
  devices: InventoryDevice[];
  labels?: string[];
}

// List inventory for all hosts (UI API)
export function useHostInventories() {
  return useQuery<HostInventory[]>({
    queryKey: ['host-inventory'],
    queryFn: async () => uiApiClient.get('host/inventory').json<HostInventory[]>(),
  });
}

// Single host inventory (API)
export function useHostInventory(hostname: string | null) {
  return useQuery<HostInventory>({
    queryKey: ['host-inventory', hostname],
    queryFn: async () => apiClient.get(`host/${hostname}/inventory`).json<HostInventory>(),
    enabled: !!hostname,
  });
}
