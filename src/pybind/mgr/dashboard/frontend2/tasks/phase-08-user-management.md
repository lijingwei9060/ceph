# Phase 8: 用户管理模块 — Summary

**Date**: 2026-04-26
**Branch**: feature/lijw-newdashboard

## Completed Tasks

### 1. Dashboard User API Hooks
**File**: `src/features/user-management/users/api/use-dashboard-user.ts`

- `DashboardUser` type (username, roles, name, email, lastUpdate, enabled, pwdExpirationDate, pwdUpdateRequired)
- `PasswordValidation` type (valid, credits, valuation)
- `StandardSettings` type (pwd_policy_enabled, pwd_policy_min_length, complexity checks, etc.)
- `useDashboardUsers()` — GET `/api/user`
- `useDashboardUser(username)` — GET `/api/user/{username}`
- `useCreateDashboardUser()` — POST `/api/user`
- `useUpdateDashboardUser()` — PUT `/api/user/{username}`
- `useDeleteDashboardUser()` — DELETE `/api/user/{username}`
- `useValidatePassword()` — POST `/api/user/validate_password`
- `useStandardSettings()` — GET `/ui-api/standard_settings` (uiApiClient)

### 2. Role API Hooks
**File**: `src/features/user-management/roles/api/use-role.ts`

- `Role` type (name, description, scopes_permissions, system)
- `useRoles()` — GET `/api/role`
- `useRole(name)` — GET `/api/role/{name}`
- `useCreateRole()` — POST `/api/role`
- `useUpdateRole()` — PUT `/api/role/{name}`
- `useDeleteRole()` — DELETE `/api/role/{name}`
- `useCloneRole()` — POST `/api/role/{name}/clone`

### 3. Scope API Hook
**File**: `src/features/user-management/roles/api/use-scope.ts`

- `useScopes()` — GET `/ui-api/scope`, returns string[] of all security scope names

### 4. User List Page
**File**: `src/features/user-management/users/pages/user-list.tsx`

- Columns: Username, Name, Email, Roles (badges), Enabled (badge), Last Update, Actions
- Toolbar: Refresh + Create buttons
- Actions dropdown: Edit / Enable-Disable toggle / Delete
- Delete confirmation dialog
- Create/Edit dialogs with UserForm

### 5. User Form (Create/Edit)
**File**: `src/features/user-management/users/components/user-form.tsx`

- Fields: Username (disabled in edit), Password (required on create, optional on edit), Confirm Password, Name, Email, Roles (toggle badges), Enabled, Password Update Required
- Password validation: calls `useValidatePassword()` with debounce, shows strength badge (Weak/OK/Strong/Very strong)
- Password policy display: shows min length and complexity status from `useStandardSettings()`
- Zod validation with password confirmation refinement

### 6. Role List Page
**File**: `src/features/user-management/roles/pages/role-list.tsx`

- Columns: Name, Description, Permissions (scope count), System (badge), Actions
- Toolbar: Refresh + Create buttons
- Actions dropdown: Edit (disabled for system roles) / Clone / Delete (disabled for system roles)
- Delete confirmation dialog
- Create/Edit/Clone dialogs with RoleForm

### 7. Role Form (Create/Edit/Clone)
**File**: `src/features/user-management/roles/components/role-form.tsx`

- Fields: Name (disabled in edit), Description
- Scope permission matrix: table with scopes as rows, read/create/update/delete as columns, checkboxes for each cell
- Uses `SCOPE_SERVER_KEY` from `@/types/permissions` for scope label mapping
- Clone mode: pre-fills all permissions from source role, name field empty
- System roles: all fields and checkboxes disabled

### 8. Routes & Navigation

- Added `user-management` redirect + `user-management/users` + `user-management/roles` routes in `src/routes/index.tsx`
- Added "User Management" nav group with Shield icon, `user` permission, Users/Roles children in `src/routes/nav-config.ts`
- Added `Shield` icon to `ICON_MAP` in `src/components/layouts/workbench-layout.tsx`

### 9. Integration Tests

**File**: `src/features/user-management/users/api/use-dashboard-user.test.tsx` (8 tests)
- useDashboardUsers, useDashboardUser (+ null guard), useCreateDashboardUser, useUpdateDashboardUser, useDeleteDashboardUser, useValidatePassword, useStandardSettings

**File**: `src/features/user-management/roles/api/use-role.test.tsx` (7 tests)
- useRoles, useRole (+ null guard), useCreateRole, useUpdateRole, useDeleteRole, useCloneRole

**File**: `src/features/user-management/roles/api/use-scope.test.tsx` (1 test)
- useScopes

## Verification Results
- `npx tsc --noEmit` — PASSED (0 errors)
- `npx vite build` — PASSED (build successful)
- `npx vitest run` — 213 tests passed (33 test files), including 16 user-management tests
- Login — auth flow unchanged

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/routes/index.tsx` | Modified | Add user-management routes (redirect, users, roles) |
| `src/routes/nav-config.ts` | Modified | Add User Management nav group with Shield icon |
| `src/components/layouts/workbench-layout.tsx` | Modified | Add Shield icon to ICON_MAP |

## Files Created

| File | Description |
|------|-------------|
| `src/features/user-management/users/api/use-dashboard-user.ts` | User API hooks + 3 types (7 hooks) |
| `src/features/user-management/users/api/use-dashboard-user.test.tsx` | User API tests (8 tests) |
| `src/features/user-management/users/components/user-form.tsx` | Create/Edit user form with password validation |
| `src/features/user-management/users/pages/user-list.tsx` | User list page with CRUD actions |
| `src/features/user-management/roles/api/use-role.ts` | Role API hooks + type (6 hooks) |
| `src/features/user-management/roles/api/use-role.test.tsx` | Role API tests (7 tests) |
| `src/features/user-management/roles/api/use-scope.ts` | Scope API hook |
| `src/features/user-management/roles/api/use-scope.test.tsx` | Scope API test (1 test) |
| `src/features/user-management/roles/components/role-form.tsx` | Create/Edit/Clone role form with permission matrix |
| `src/features/user-management/roles/pages/role-list.tsx` | Role list page with clone/edit/delete |
