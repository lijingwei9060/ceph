# Bug 04: Pool 表单未使用导入和 React Compiler 错误

**Date**: 2026-04-26
**Status**: Fixed

## Bug 描述

ESLint 和 React Compiler 报告 `src/features/cluster/pools/components/pool-form.tsx` 中存在多个问题：

```
src/features/cluster/pools/components/pool-form.tsx
  12:8   error  'ErasureCodeProfile' is defined but never used  @typescript-eslint/no-unused-vars
  556:3  error  'info' is defined but never used              @typescript-eslint/no-unused-vars
  573:7  error  Calling setState synchronously within an effect can trigger cascading renders
```

## 修复内容

### 修改文件
- `src/features/cluster/pools/components/pool-form.tsx`

### 具体修改

#### 1. 移除未使用的类型导入
- 移除 `type ErasureCodeProfile`
- 移除 `type PoolInfo`

#### 2. 移除未使用的组件 prop
- `EcProfileCreateDialog` 组件的 `info` prop 被移除

#### 3. 修复 React Compiler 错误
将 `useEffect` 中同步调用 `setState` 的模式重构为事件处理函数中调用：

**修复前:**
```tsx
useEffect(() => {
  const defaults = PLUGIN_DEFAULTS[plugin];
  if (defaults) {
    setK(defaults.k);
    setM(defaults.m);
    setTechnique(defaults.technique);
  }
}, [plugin]);

// ...
<Select value={plugin} onValueChange={setPlugin}>
```

**修复后:**
```tsx
const handlePluginChange = (newPlugin: string) => {
  setPlugin(newPlugin);
  const defaults = PLUGIN_DEFAULTS[newPlugin];
  if (defaults) {
    setK(defaults.k);
    setM(defaults.m);
    setTechnique(defaults.technique);
  }
};

// ...
<Select value={plugin} onValueChange={handlePluginChange}>
```

## 影响页面

- 存储池创建/编辑表单 (`/pools`)
- 纠删码配置创建对话框

## 解决的问题

1. 消除 3 个 ESLint/React Compiler 错误
2. 清理无用导入
3. 修复 React Compiler 不推荐的 useEffect + setState 模式

## 测试情况

- **ESLint**: 0 errors, 1 warning (React Hook Form 兼容性警告，可接受)
- **TypeScript**: 通过
- **单元测试**: 未涉及

## 其他问题

### 剩余 Warning
```
Compilation Skipped: Use of incompatible library
React Hook Form's `useForm()` API returns a `watch()` function which cannot be memoized safely.
```

这是一个已知问题，React Hook Form 的 `watch()` 函数与 React Compiler 的 memoization 不完全兼容。这个 warning 不会影响功能，可以选择：
1. 忽略此 warning
2. 使用 `useFormState` 替代 `watch`（需要更大规模重构）
3. 使用 `eslint-disable` 注释禁用此 warning

### 建议
- 后续添加单元测试覆盖此组件
- 考虑将 `EcProfileCreateDialog` 提取为独立文件以提高可维护性
