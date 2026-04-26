# Phase 7: RGW Detail Pages & User Form Enhancement — Summary

**Date**: 2026-04-26
**Branch**: feature/lijw-newdashboard

## Completed Tasks

### 1. RGW User API Hooks (8 new hooks + 2 new types)
**File**: `src/features/rgw/user/api/use-rgw-user.ts`

| Hook | Endpoint | Method | Version |
|------|----------|--------|---------|
| `useRgwUserQuota(uid)` | `/api/rgw/user/{uid}/quota` | GET | v1.0 |
| `useSetRgwUserQuota()` | `/api/rgw/user/{uid}/quota` | PUT | v1.0 |
| `useCreateRgwUserSubuser()` | `/api/rgw/user/{uid}/subuser` | POST | v1.0 |
| `useDeleteRgwUserSubuser()` | `/api/rgw/user/{uid}/subuser/{subuser}` | DELETE | v1.0 |
| `useCreateRgwUserCapability()` | `/api/rgw/user/{uid}/capability` | POST | v1.0 |
| `useDeleteRgwUserCapability()` | `/api/rgw/user/{uid}/capability` | DELETE | v1.0 |
| `useCreateRgwUserKey()` | `/api/rgw/user/{uid}/key` | POST | v1.0 |
| `useDeleteRgwUserKey()` | `/api/rgw/user/{uid}/key` | DELETE | v1.0 |

New types: `RgwUserQuota`, `RgwUserQuotaResponse`. Enhanced `RgwUser` type with `swift_keys`, `system`, and proper quota types.

### 2. RGW User Components (3 new files)

- **`rgw-user-detail.tsx`** — Detail dialog with Details + Keys tabs:
  - Details tab: key-value table (user_id, tenant, display_name, email, suspended, system, max_buckets, subusers, capabilities, mfa_ids) + User Quota + Bucket Quota sections
  - Keys tab: combined S3/Swift key list with View and Delete buttons
  - Inline delete for subusers, capabilities, and S3 keys

- **`rgw-user-form.tsx`** — Full create/edit form with `useForm` + `zodResolver`:
  - Basic fields: user_id, display_name, email, max_buckets (Disabled/Unlimited/Custom), suspended
  - Create-only: generate_key checkbox, access_key, secret_key
  - User Quota section: enabled, unlimited size + binary input, unlimited objects + number input
  - Bucket Quota section: same pattern
  - Edit-mode: read-only sub-resources display (subusers, keys, capabilities)
  - Calls setQuota after user create/update

- **`rgw-user-key-dialog.tsx`** — S3/Swift key view modal with `buildKeyList` helper

### 3. RGW User List Page Enhancement
**File**: `src/features/rgw/user/pages/user-list.tsx`
- Replaced inline 3-field create dialog with full `RgwUserForm`
- Added dropdown menu with View Details / Edit / Delete actions
- User ID column links to detail dialog
- Edit action opens form with `initialData`

### 4. RGW Bucket API Hooks & Fixes
**File**: `src/features/rgw/bucket/api/use-rgw-bucket.ts`

| Hook | Endpoint | Method | Version |
|------|----------|--------|---------|
| `useRgwBucket(name)` | `/api/rgw/bucket/{name}` | GET | v1.0 |
| `useUpdateRgwBucket()` | `/api/rgw/bucket/{name}` | PUT | v1.0 |

Fix: `useRgwBuckets` now uses proper `searchParams` option instead of URL hack (`rgw/bucket?stats=true` → `searchParams: { stats: 'true' }`)

New type: `RgwBucketDetail` with full detail fields (id, index_type, marker, encryption, lock_enabled, lock_mode, lock_retention_period_days, bucket_quota)

### 5. RGW Bucket Detail Component
**File**: `src/features/rgw/bucket/components/rgw-bucket-detail.tsx`
- Key-value table: name, id, owner, index_type, placement_rule, marker, version, zonegroup, zone, versioning, encryption
- Bucket Quota section (enabled, max_size, max_objects)
- Object Locking section (mode, retention days)
- Uses `useRgwBucket` hook to fetch detail data

### 6. RGW Bucket List Page Enhancement
**File**: `src/features/rgw/bucket/pages/bucket-list.tsx`
- Added dropdown menu with View Details / Delete actions
- Bucket name column links to detail dialog
- Replaced inline create with proper `useForm`-based create dialog (bucket name + owner dropdown from `useRgwUserIds`)

### 7. RGW Daemon Detail Dialog
**File**: `src/features/rgw/daemon/components/rgw-daemon-detail.tsx`
- Key-value table from `rgw_metadata`: id, ceph_version, realm, zonegroup, zone
- Uses existing `useRgwDaemon(svcId)` hook

**File**: `src/features/rgw/daemon/pages/daemon-list.tsx`
- Daemon ID column links to detail dialog

### 8. Integration Tests
**File**: `src/features/rgw/user/api/use-rgw-user.test.tsx` (10 new test cases)
- `useRgwUserQuota` — fetch + null guard
- `useSetRgwUserQuota` — PUT with quota data
- `useCreateRgwUserSubuser` — POST
- `useDeleteRgwUserSubuser` — DELETE with path param
- `useCreateRgwUserCapability` — POST with searchParams
- `useDeleteRgwUserCapability` — DELETE with searchParams
- `useCreateRgwUserKey` — POST
- `useDeleteRgwUserKey` — DELETE with searchParams

**File**: `src/features/rgw/bucket/api/use-rgw-bucket.test.tsx` (rewritten, 7 test cases)
- `useRgwBuckets` — v1.1 header + searchParams
- `useRgwBucket` — fetch detail + null guard
- `useDeleteRgwBucket` — DELETE
- `useCreateRgwBucket` — PUT (note: backend uses PUT for create)
- `useUpdateRgwBucket` — PUT with update data

## Verification Results
- `npx tsc --noEmit` — PASSED (0 errors)
- `npx vite build` — PASSED (build successful)
- `npx vitest run` — 187 tests passed (29 test files), including 22 RGW tests (15 user + 7 bucket)
- Login — apiClient/uiApiClient both use v1.0 Accept header, auth flow unchanged

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/features/rgw/user/api/use-rgw-user.ts` | Modified | Added 8 hooks + 2 types, enhanced RgwUser type |
| `src/features/rgw/user/api/use-rgw-user.test.tsx` | Modified | Added 10 test cases |
| `src/features/rgw/user/components/rgw-user-detail.tsx` | Created | User detail dialog (Details + Keys tabs) |
| `src/features/rgw/user/components/rgw-user-form.tsx` | Created | Full create/edit form with quotas |
| `src/features/rgw/user/components/rgw-user-key-dialog.tsx` | Created | S3/Swift key view modal |
| `src/features/rgw/user/pages/user-list.tsx` | Modified | Added detail/edit dropdown, replaced inline form |
| `src/features/rgw/bucket/api/use-rgw-bucket.ts` | Modified | Added 2 hooks + RgwBucketDetail type, fixed searchParams |
| `src/features/rgw/bucket/api/use-rgw-bucket.test.tsx` | Rewritten | 7 test cases with proper searchParams |
| `src/features/rgw/bucket/components/rgw-bucket-detail.tsx` | Created | Bucket detail dialog |
| `src/features/rgw/bucket/pages/bucket-list.tsx` | Modified | Added detail dropdown, replaced inline create |
| `src/features/rgw/daemon/components/rgw-daemon-detail.tsx` | Created | Daemon detail dialog |
| `src/features/rgw/daemon/pages/daemon-list.tsx` | Modified | Added detail dialog link |
