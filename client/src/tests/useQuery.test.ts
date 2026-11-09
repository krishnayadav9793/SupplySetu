import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useQuery, invalidateQuery } from '../hooks/useQuery';

describe('useQuery Hook', () => {
  beforeEach(() => {
    invalidateQuery();
  });

  it('fetches and returns query data with loading state', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({ id: 1, name: 'Parle-G' });

    const { result } = renderHook(() => useQuery('test-key-1', mockFetcher));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Parle-G' });
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('serves cached data and does not refetch if fresh within staleTime', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({ id: 2, name: 'Tata Salt' });

    const { result: firstResult } = renderHook(() =>
      useQuery('test-key-cache', mockFetcher, { staleTime: 60000 })
    );

    await waitFor(() => {
      expect(firstResult.current.data).toEqual({ id: 2, name: 'Tata Salt' });
    });

    // Second hook call with the same key
    const { result: secondResult } = renderHook(() =>
      useQuery('test-key-cache', mockFetcher, { staleTime: 60000 })
    );

    expect(secondResult.current.data).toEqual({ id: 2, name: 'Tata Salt' });
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('handles fetch errors gracefully and updates error state', async () => {
    const mockFetcher = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQuery('test-key-error', mockFetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.data).toBeUndefined();
  });

  it('refetch forces cache update', async () => {
    let callCount = 0;
    const mockFetcher = vi.fn().mockImplementation(async () => {
      callCount += 1;
      return { count: callCount };
    });

    const { result } = renderHook(() =>
      useQuery('test-key-refetch', mockFetcher, { staleTime: 60000 })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 1 });
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual({ count: 2 });
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });
});
