# Phase 6: CephFS & NFS Enhancement — Summary

**Date**: 2025-04-25
**Branch**: feature/lijw-newdashboard

## Completed Tasks

### 1. CephFS API Hooks (9 new hooks + 3 new types)
**File**: `src/features/filesystem/api/use-cephfs.ts`

| Hook | Endpoint | Method | Notes |
|------|----------|--------|-------|
| `useCephFsRootDir(fsId)` | `/api/cephfs/{fsId}/get_root_directory` | GET | v1.0 |
| `useCephFsLsDir(fsId, path)` | `/api/cephfs/{fsId}/ls_dir?depth=2&path=` | GET | v1.0 |
| `useCephFsMdsCounters(fsId)` | `/api/cephfs/{fsId}/mds_counters` | GET | v1.0 |
| `useCephFsQuota(fsId, path)` | `/api/cephfs/{fsId}/quota?path=` | GET | v1.0 |
| `useSetCephFsQuota()` | `/api/cephfs/{fsId}/quota?path=` | PUT | v1.0 |
| `useCreateCephFsSnapshot()` | `/api/cephfs/{fsId}/snapshot?path=&name=` | POST | v1.0 |
| `useDeleteCephFsSnapshot()` | `/api/cephfs/{fsId}/snapshot?path=&name=` | DELETE | v1.0 |
| `useMkCephFsTree()` | `/api/cephfs/{fsId}/tree` | POST | v1.0 |
| `useRmCephFsTree()` | `/api/cephfs/{fsId}/tree` | DELETE | v1.0 |

New types: `CephFsDirEntry`, `CephFsQuotas`, `CephFsSnapshot`

### 2. CephFS Components (3 new files)
- **`cephfs-directory-tree.tsx`** — Two-panel directory browser:
  - `DirectoryNode`: recursive expandable tree with ChevronRight/Down, Folder icon
  - `CephFsDirectoryTree`: wrapper rendering root node
  - `CephFsDirectoryPanel`: right panel with path, quota editor, snapshot table
- **`cephfs-quota-table.tsx`** — Quota editor with inline Set/Update/Unset, `parseSize` helper supporting 10G/1T format, hidden for root directory
- **`cephfs-snapshot-table.tsx`** — Snapshot CRUD table with auto-generated ISO timestamp names

### 3. CephFS List Page Enhancement
**File**: `src/features/filesystem/pages/cephfs-list.tsx`
- Added `FsMdsBadge` component fetching detail to show active/total rank count (e.g., "1/3 active")
- Added "MDS Ranks" column

### 4. CephFS Detail Dialog Enhancement
**File**: `src/features/filesystem/components/cephfs-detail.tsx`
- Added "Directories" tab (conditional on `rootDir` data)
- Two-panel layout: directory tree (left 50%) + directory panel (right 50%)
- Dialog width increased to `max-w-3xl`
- TabsList set to `flex-wrap` to handle more tabs

### 5. NFS API Hooks (4 new hooks + 3 new types)
**File**: `src/features/block/nfs/api/use-nfs.ts`

| Hook | Endpoint | Method | Notes |
|------|----------|--------|-------|
| `useNfsClusters()` | `/api/nfs-ganesha/cluster` | GET | v0.1 (EXPERIMENTAL) |
| `useNfsFsals()` | `/ui-api/nfs-ganesha/fsals` | GET | uiApiClient v1.0 |
| `useNfsFilesystems()` | `/ui-api/nfs-ganesha/cephfs/filesystems` | GET | uiApiClient v1.0 |
| `useNfsLsDir(fsName, rootDir)` | `/ui-api/nfs-ganesha/lsdir/{fsName}?root_dir=` | GET | uiApiClient v1.0 |

New types: `NfsCluster`, `NfsFsal`, `NfsFilesystem`

### 6. NFS Export Form Full Rewrite
**File**: `src/features/block/nfs/components/nfs-export-form.tsx`
- Create and edit mode via `initialData` prop
- Cluster dropdown from `useNfsClusters()`, disabled in edit mode
- FSAL dropdown with conditional fields:
  - CEPH → Volume dropdown (`useNfsFilesystems`), Path input, Security Label checkbox + xattr
  - RGW → Bucket text input
- Protocol: NFSv3/NFSv4 checkboxes
- Transport: TCP/UDP checkboxes
- Client sub-form: Add/Remove client entries (addresses comma-separated, access_type, squash)
- Auto-generates pseudo from path via useEffect
- zod schema with `clients` array field

### 7. NFS List Page Enhancement
**File**: `src/features/block/nfs/pages/nfs-list.tsx`
- View Details action (opens detail dialog with Details + Clients tabs)
- Edit action (opens form dialog with `initialData`)
- Delete action (existing, kept)
- DropdownMenuSeparator between edit and destructive actions

### 8. NFS Export Detail Component (new file)
**File**: `src/features/block/nfs/components/nfs-export-detail.tsx`
- Two tabs: Details (key-value rows) + Clients (address badges with access/squash)
- Shows all export fields: cluster, path, pseudo, access, squash, FSAL, protocols, transports, security label

### 9. Integration Tests
**File**: `src/features/filesystem/api/use-cephfs.test.tsx` (10 new test cases)
- `useCephFsRootDir` — fetch + null guard
- `useCephFsLsDir` — fetch with searchParams + null guard
- `useCephFsMdsCounters` — fetch
- `useCephFsQuota` — fetch with searchParams + null guard
- `useSetCephFsQuota` — PUT with searchParams + json
- `useCreateCephFsSnapshot` — POST with searchParams
- `useDeleteCephFsSnapshot` — DELETE with searchParams
- `useMkCephFsTree` — POST with json
- `useRmCephFsTree` — DELETE with json

**File**: `src/features/block/nfs/api/use-nfs.test.tsx` (8 new test cases)
- `useNfsClusters` — fetch with v0.1 header
- `useNfsFsals` — fetch via uiApiClient
- `useNfsFilesystems` — fetch via uiApiClient
- `useNfsLsDir` — fetch with searchParams + null guard
- `useCreateNfsExport` — POST with v2.0 header
- `useUpdateNfsExport` — PUT with v2.0 header

## Verification Results
- `npx tsc --noEmit` — PASSED (0 errors)
- `npx vite build` — PASSED (build successful)
- `npx vitest run` — 174 tests passed (29 test files), including 16 CephFS + 11 NFS hook tests
- Login — apiClient/uiApiClient both use v1.0 Accept header, auth flow unchanged

## Bug Fix
- `cephfs-quota-table.tsx` imported non-existent `formatBytes` → fixed to use `formatDimlessBinary` from `@/lib/format`

## Files Changed
| File | Action | Description |
|------|--------|-------------|
| `src/features/filesystem/api/use-cephfs.ts` | Modified | Added 9 hooks + 3 types |
| `src/features/filesystem/api/use-cephfs.test.tsx` | Modified | Added 10 test cases |
| `src/features/filesystem/components/cephfs-detail.tsx` | Modified | Added Directories tab |
| `src/features/filesystem/components/cephfs-directory-tree.tsx` | Created | Directory browser |
| `src/features/filesystem/components/cephfs-quota-table.tsx` | Created | Quota editor |
| `src/features/filesystem/components/cephfs-snapshot-table.tsx` | Created | Snapshot CRUD |
| `src/features/filesystem/pages/cephfs-list.tsx` | Modified | Added MDS Ranks column |
| `src/features/block/nfs/api/use-nfs.ts` | Modified | Added 4 hooks + 3 types |
| `src/features/block/nfs/api/use-nfs.test.tsx` | Modified | Added 8 test cases |
| `src/features/block/nfs/components/nfs-export-form.tsx` | Modified | Full rewrite with edit mode + conditional fields |
| `src/features/block/nfs/components/nfs-export-detail.tsx` | Created | Detail dialog with tabs |
| `src/features/block/nfs/pages/nfs-list.tsx` | Modified | Added Edit + View Details actions |
