import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const cacheTime = 1000 * 60 * 60 * 24; // 24 hours

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: cacheTime,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: cacheTime,
});

export const smartphoneKeys = {
  all: ['smartphones'] as const,
  lists: () => [...smartphoneKeys.all, 'list'] as const,
  details: (id: string) => [...smartphoneKeys.all, 'detail', id] as const,
};

export const cameraKeys = {
  all: ['cameras'] as const,
  lists: () => [...cameraKeys.all, 'list'] as const,
  details: (id: string) => [...cameraKeys.all, 'detail', id] as const,
};

export const laptopKeys = {
  all: ['laptops'] as const,
  lists: () => [...laptopKeys.all, 'list'] as const,
  details: (id: string) => [...laptopKeys.all, 'detail', id] as const,
};