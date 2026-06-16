import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { apiRequest, formatApiDate, gymChallApi } from './client';

describe('apiRequest', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('returns parsed JSON for successful responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ displayName: 'Rafa' }]
    } as Response);

    const result = await gymChallApi.listParticipants();

    expect(result).toEqual([{ displayName: 'Rafa' }]);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/participants', {
      headers: { 'Content-Type': 'application/json' }
    });
  });

  test('returns undefined for 204 responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content'
    } as Response);

    const result = await apiRequest<void>('/api/admin/check-ins/abc/invalidate', { method: 'POST' });

    expect(result).toBeUndefined();
  });

  test('throws a useful error for non-ok responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    } as Response);

    await expect(apiRequest('/api/broken')).rejects.toThrow('API 500: Server Error');
  });
});

describe('formatApiDate', () => {
  test('formats dates as YYYY-MM-DD', () => {
    expect(formatApiDate(new Date('2026-06-15T10:30:00.000Z'))).toBe('2026-06-15');
  });
});
