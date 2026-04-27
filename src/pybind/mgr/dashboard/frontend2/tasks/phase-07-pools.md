# Phase 7: 存储池模块 — Summary

**Date**: 2026-04-26
**Branch**: feature/lijw-newdashboard

## Completed Tasks

### 1. Pool API Enhancements
**File**: `src/features/cluster/pools/api/use-pool.ts`

- Fixed `usePools(stats)` to use proper `searchParams` instead of URL hack
- Added `PoolInfo` type (crush_rules, ec_profiles, osd_count, compression settings, etc.)
- Added `PoolStats` type (bytes_used, max_avail, percent_used, rd/wr bytes and ops)
- Added `CrushRuleInfo` type (name, usable_size)
- Added `usePoolInfo()` hook — GET `/ui-api/pool/info` for create form pre-fill data
- Enhanced `Pool` type with compression, quota, stats, pg_status fields
- Enhanced `usePool(name)` to include `stats=true` searchParams

### 2. EC Profile API Hooks
**File**: `src/features/cluster/pools/api/use-ec-profile.ts` (NEW)

| Hook | Endpoint | Method |
|------|----------|--------|
| `useErasureCodeProfiles()` | `/api/erasure_code_profile` | GET |
| `useErasureCodeProfile(name)` | `/api/erasure_code_profile/{name}` | GET |
| `useEcProfileInfo()` | `/ui-api/erasure_code_profile/info` | GET |
| `useCreateErasureCodeProfile()` | `/api/erasure_code_profile` | POST |
| `useDeleteErasureCodeProfile()` | `/api/erasure_code_profile/{name}` | DELETE |

New types: `ErasureCodeProfile`, `EcProfileInfo`

### 3. PG Calculator Utility
**File**: `src/features/cluster/pools/components/pg-calculator.ts` (NEW)

- `calculatePgNumReplicated(osdCount, size)` — pgMax/osd_count*100 / size, aligned to power of 2
- `calculatePgNumErasure(osdCount, k, m)` — pgMax / (k+m), aligned to power of 2
- `pgNumIncrement(current)` / `pgNumDecrement(current)` — power-of-2 jump helpers
- Matches Angular frontend logic exactly

### 4. Pool Form — Complete Rewrite
**File**: `src/features/cluster/pools/components/pool-form.tsx` (REPLACES pool-create-form.tsx)

**Basic Configuration:**
- Pool name (pattern validated, disabled in edit mode)
- Type: Replicated / Erasure Coded (disabled in edit mode)
- PG Autoscale Mode: select from info.pg_autoscale_modes
- PG Num: number input (hidden when autoscale=on), with calculated suggestion
- CRUSH Rule: select from crush_rules_replicated or crush_rules_erasure

**Replicated Config:**
- Size (replication factor), min=1, max=10

**Erasure Coded Config:**
- EC Profile: select dropdown showing k/m values
- New EC Profile button (opens create dialog)
- EC Overwrites checkbox (only when is_all_bluestore)
- Profile details display (plugin, technique, k, m, failure domain)

**Compression (is_all_bluestore only):**
- Compression Mode: none/passive/aggressive/force
- Compression Algorithm: lz4/snappy/zlib/zstd
- Min/Max Blob Size: binary input
- Compression Ratio: 0-1

**Quotas:**
- Max Bytes: binary input (0 = unlimited)
- Max Objects: number (0 = unlimited)

**Applications:** cephfs, rbd, rgw toggle badges

**Edit mode:** Pre-fills all values from initialData, name/type disabled

**PG Calculator:** Auto-calculates pg_num when pool_type/size/ec_profile changes

### 5. EC Profile Create Dialog
**File**: Embedded within `pool-form.tsx` as `EcProfileCreateDialog`

- Profile Name, Plugin (jerasure/lrc/isa/shec/clay), k, m
- Plugin-specific defaults auto-populate on plugin change
- Technique select for jerasure/isa/clay
- After creation, auto-selects the new profile in the pool form

### 6. Pool List Page Enhancement
**File**: `src/features/cluster/pools/pages/pool-list.tsx`

- **New column: Data Protection** — Shows "replica: xN" or "EC: k+m" based on pool type and EC profile
- **New column: Usage** — Progress bar with bytes_used and percent_used
- **New column: PGs** — Shows current pg_num with target arrow if PGs are updating
- **Type filter** — Dropdown to filter by All/Replicated/Erasure Coded
- **Edit action** — Opens PoolForm dialog with initialData
- **Dropdown menu** — Edit / Delete actions

### 7. Integration Tests
**File**: `src/features/cluster/pools/api/use-pool.test.tsx` (8 tests)
- usePools: list + searchParams fix
- usePool: fetch with stats + null guard
- usePoolInfo: uiApiClient fetch
- useCreatePool, useDeletePool, useUpdatePool

**File**: `src/features/cluster/pools/api/use-ec-profile.test.tsx` (6 tests, NEW)
- useErasureCodeProfiles, useErasureCodeProfile, useEcProfileInfo
- useCreateErasureCodeProfile, useDeleteErasureCodeProfile

## Verification Results
- `npx tsc --noEmit` — PASSED (0 errors)
- `npx vite build` — PASSED (build successful)
- `npx vitest run` — 197 tests passed (30 test files), including 14 pool/EC tests
- Login — auth flow unchanged

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/cluster/pools/api/use-pool.ts` | Modified | Fix searchParams, add PoolInfo/PoolStats types, add usePoolInfo |
| `src/features/cluster/pools/api/use-pool.test.tsx` | Modified | Add usePoolInfo/usePool tests, fix searchParams tests |
| `src/features/cluster/pools/api/use-ec-profile.ts` | Created | EC profile hooks (5 hooks + 2 types) |
| `src/features/cluster/pools/api/use-ec-profile.test.tsx` | Created | EC profile hook tests (6 tests) |
| `src/features/cluster/pools/components/pool-form.tsx` | Created | Full create/edit pool form + EC profile dialog |
| `src/features/cluster/pools/components/pg-calculator.ts` | Created | PG calculator utility |
| `src/features/cluster/pools/components/pool-create-form.tsx` | DELETED | Replaced by pool-form.tsx (no longer imported) |
| `src/features/cluster/pools/pages/pool-list.tsx` | Modified | Add Data Protection/Usage cols, Edit action, type filter |

## Note
- `pool-create-form.tsx` still exists but is no longer imported. It can be deleted in cleanup.
