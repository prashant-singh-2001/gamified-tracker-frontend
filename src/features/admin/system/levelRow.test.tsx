import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { makeTestQueryClient, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import { useLevelRow } from './api';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={makeTestQueryClient()}>{children}</QueryClientProvider>
);

describe('useLevelRow', () => {
  it('reads one tracker by its id', async () => {
    signIn(7, 'USER');
    const asked: string[] = [];
    server.use(
      http.get('*/api/level/:id', ({ params }) => {
        asked.push(String(params.id));
        return HttpResponse.json({
          userId: 7,
          activityId: 11,
          level: 3,
          totalXp: 450,
          currentLevelXp: 150,
          xpForNextLevel: 0,
          progressPercent: 100,
          leveledUp: false,
        });
      }),
    );
    const { result } = renderHook(() => useLevelRow(42), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(asked).toEqual(['42']);
    expect(result.current.data?.level).toBe(3);
  });

  it('does not ask until it has an id', () => {
    signIn(7, 'USER');
    const { result } = renderHook(() => useLevelRow(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is a 404 for a tracker that is not yours or does not exist', async () => {
    signIn(7, 'USER');
    server.use(
      http.get('*/api/level/:id', () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useLevelRow(9), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
