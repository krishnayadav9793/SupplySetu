import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabRouting, getDefaultTabForRole } from '../hooks/useTabRouting';

describe('useTabRouting Hook', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('provides default tab for RETAILER role', () => {
    expect(getDefaultTabForRole('RETAILER')).toBe('shop');

    const { result } = renderHook(() => useTabRouting('RETAILER'));
    expect(result.current.currentTab).toBe('shop');
  });

  it('provides default tab for ADMIN role', () => {
    expect(getDefaultTabForRole('ADMIN')).toBe('orders');

    const { result } = renderHook(() => useTabRouting('ADMIN'));
    expect(result.current.currentTab).toBe('orders');
  });

  it('provides default tab for SALESMAN role', () => {
    expect(getDefaultTabForRole('SALESMAN')).toBe('beat');

    const { result } = renderHook(() => useTabRouting('SALESMAN'));
    expect(result.current.currentTab).toBe('beat');
  });

  it('navigates to allowed tab and updates URL hash', () => {
    const { result } = renderHook(() => useTabRouting('ADMIN'));

    act(() => {
      result.current.setCurrentTab('export');
    });

    expect(result.current.currentTab).toBe('export');
    expect(window.location.hash).toBe('#export');
  });

  it('falls back to default tab if an unauthorized tab is supplied', () => {
    const { result } = renderHook(() => useTabRouting('RETAILER'));

    act(() => {
      // 'export' is only allowed for ADMIN, not RETAILER
      result.current.setCurrentTab('export');
    });

    expect(result.current.currentTab).toBe('shop');
  });

  it('initializes from existing URL hash when valid', () => {
    window.location.hash = '#schemes';

    const { result } = renderHook(() => useTabRouting('RETAILER'));
    expect(result.current.currentTab).toBe('schemes');
  });
});
