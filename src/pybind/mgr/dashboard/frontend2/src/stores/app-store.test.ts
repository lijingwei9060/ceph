import { describe, it, expect } from 'vitest';
import { useAppStore } from '@/stores/app-store';

describe('app-store', () => {
  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.sidebarOpen).toBe(true);
  });

  it('toggles sidebar', () => {
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(false);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(true);
  });

  it('sets sidebar open state', () => {
    useAppStore.getState().setSidebarOpen(false);
    expect(useAppStore.getState().sidebarOpen).toBe(false);
    useAppStore.getState().setSidebarOpen(true);
    expect(useAppStore.getState().sidebarOpen).toBe(true);
  });
});
