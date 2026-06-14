// ============================================================
// Thin fetch layer + typed data hooks. Every request attaches the
// Supabase access token and unwraps the backend's { data } envelope.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  HomeData,
  InsightsData,
  ProfileData,
  Streaks,
  Badge,
  TransactionsPage,
} from '../types/api';

export type ApiResponse<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number
  ) {
    super(message);
  }
}

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new ApiError('No session', 401);
  return session.access_token;
}

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(BASE + path, {
    headers: { Authorization: 'Bearer ' + token },
  });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.error ?? 'Request failed', res.status);
  return (json.data ?? json) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.error ?? 'Request failed', res.status);
  return (json.data ?? json) as T;
}

// ── Generic resource hook ────────────────────────────────────
function useApiResource<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList
): ApiResponse<T> & { refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

export function useDashboard(): ApiResponse<HomeData> & { refetch: () => void } {
  return useApiResource<HomeData>(() => apiGet<HomeData>('/api/home/dashboard'), []);
}

export function useInsights(range: '7d' | '30d'): ApiResponse<InsightsData> & { refetch: () => void } {
  return useApiResource<InsightsData>(() => apiGet<InsightsData>(`/api/insights?range=${range}`), [range]);
}

export function useProfile(): ApiResponse<ProfileData> & { refetch: () => void } {
  return useApiResource<ProfileData>(() => apiGet<ProfileData>('/api/profile'), []);
}

export function useStreaks(): ApiResponse<Streaks> & { refetch: () => void } {
  return useApiResource<Streaks>(() => apiGet<Streaks>('/api/profile/streaks'), []);
}

export function useBadges(): ApiResponse<{ badges: Badge[] }> & { refetch: () => void } {
  return useApiResource<{ badges: Badge[] }>(() => apiGet<{ badges: Badge[] }>('/api/profile/badges'), []);
}

export function useTransactions(
  limit = 20
): ApiResponse<TransactionsPage> & { fetchMore: () => void } {
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await apiGet<TransactionsPage>(`/api/transactions?limit=${limit}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const fetchMore = useCallback(async () => {
    if (!data || !data.hasMore || !data.nextCursor) return;
    try {
      const cursor = encodeURIComponent(data.nextCursor);
      const next = await apiGet<TransactionsPage>(`/api/transactions?limit=${limit}&cursor=${cursor}`);
      setData((prev) =>
        prev
          ? {
              transactions: [...prev.transactions, ...next.transactions],
              nextCursor: next.nextCursor,
              hasMore: next.hasMore,
            }
          : next
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    }
  }, [data, limit]);

  return { data, isLoading, error, fetchMore };
}
