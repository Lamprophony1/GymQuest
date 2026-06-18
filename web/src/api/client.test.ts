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
      credentials: 'include',
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

  test('posts PIN login credentials with cookies enabled', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        participant: { id: 'rafa-id', displayName: 'Rafa', username: 'rafa', role: 1, active: true }
      })
    } as Response);

    await gymChallApi.login({ participantId: 'rafa-id', pin: '123456' });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ participantId: 'rafa-id', pin: '123456' })
    });
  });

  test('requests admin calendar check-ins by date range', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => []
    } as Response);

    await gymChallApi.listCalendarCheckIns('2026-06-15', '2026-06-21');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/admin/check-ins/calendar?from=2026-06-15&to=2026-06-21', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
  });

  test('reads and updates private profile data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'rafa-id', weightKg: 82.4, heightCm: 178, bodyMassIndex: 26 })
    } as Response);

    await gymChallApi.getProfile('rafa-id');
    await gymChallApi.updateProfile({ participantId: 'rafa-id', weightKg: 82.4, heightCm: 178 });

    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, '/api/profile?participantId=rafa-id', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(globalThis.fetch).toHaveBeenNthCalledWith(2, '/api/profile', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ participantId: 'rafa-id', weightKg: 82.4, heightCm: 178 })
    });
  });

  test('posts own PIN change request with cookies enabled', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content'
    } as Response);

    await gymChallApi.changePin({ participantId: 'rafa-id', currentPin: '123456', newPin: '2468' });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/change-pin', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ participantId: 'rafa-id', currentPin: '123456', newPin: '2468' })
    });
  });
});

describe('formatApiDate', () => {
  test('formats dates as YYYY-MM-DD', () => {
    expect(formatApiDate(new Date('2026-06-15T10:30:00.000Z'))).toBe('2026-06-15');
  });
});
