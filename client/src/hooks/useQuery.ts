import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export interface QueryOptions<T> {
  /** Time in milliseconds before cached data is considered stale. Default: 30,000ms (30s) */
  staleTime?: number;
  /** Whether the query should execute automatically. Default: true */
  enabled?: boolean;
  /** Initial fallback data */
  initialData?: T;
  /** Callback on successful fetch */
  onSuccess?: (data: T) => void;
  /** Callback on fetch failure */
  onError?: (error: Error) => void;
}

export interface QueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<T | undefined>;
}

/**
 * Lightweight client query and cache management hook with concurrent deduplication
 * and stale-while-revalidate caching.
 */
export function useQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const { staleTime = 30000, enabled = true, initialData, onSuccess, onError } = options;

  const getCached = useCallback(() => {
    return queryCache.get(queryKey) as CacheEntry<T> | undefined;
  }, [queryKey]);

  const [data, setData] = useState<T | undefined>(() => getCached()?.data ?? initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => enabled && !getCached());
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeFetch = useCallback(async (): Promise<T | undefined> => {
    if (!isMountedRef.current) return undefined;

    setIsFetching(true);
    if (!queryCache.has(queryKey)) {
      setIsLoading(true);
    }

    try {
      // Deduplicate simultaneous requests for identical keys
      let requestPromise = inFlightRequests.get(queryKey) as Promise<T> | undefined;
      if (!requestPromise) {
        requestPromise = queryFn();
        inFlightRequests.set(queryKey, requestPromise);
      }

      const result = await requestPromise;
      queryCache.set(queryKey, { data: result, timestamp: Date.now() });

      if (isMountedRef.current) {
        setData(result);
        setError(null);
        setIsLoading(false);
        setIsFetching(false);
        onSuccess?.(result);
      }
      return result;
    } catch (err) {
      const formattedError = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(formattedError);
        setIsLoading(false);
        setIsFetching(false);
        onError?.(formattedError);
      }
      return undefined;
    } finally {
      inFlightRequests.delete(queryKey);
    }
  }, [queryKey, queryFn, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) return;

    const entry = getCached();
    const isStale = !entry || Date.now() - entry.timestamp > staleTime;

    if (isStale) {
      executeFetch();
    } else if (entry && isMountedRef.current) {
      setData(entry.data);
      setIsLoading(false);
    }
  }, [queryKey, enabled, staleTime, getCached, executeFetch]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    refetch: executeFetch,
  };
}

/** Clear all or specific entries from in-memory query cache */
export function invalidateQuery(queryKey?: string): void {
  if (queryKey) {
    queryCache.delete(queryKey);
  } else {
    queryCache.clear();
  }
}
