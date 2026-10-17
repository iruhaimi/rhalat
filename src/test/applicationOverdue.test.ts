import { describe, expect, it } from 'vitest';
import { isApplicationOverdue } from '@/lib/applicationOverdue';

const now = Date.parse('2026-10-17T13:09:00Z');

describe('application overdue rules', () => {
  it('requires strictly more than 3 days', () => {
    expect(isApplicationOverdue({ status: 'processing', updated_at: '2026-10-14T13:09:00Z' }, now)).toBe(false);
    expect(isApplicationOverdue({ status: 'processing', updated_at: '2026-10-14T13:08:59Z' }, now)).toBe(true);
  });

  it('uses the newest status history rather than unrelated application updates', () => {
    expect(isApplicationOverdue({
      status: 'under_review', updated_at: '2026-10-17T12:00:00Z',
      application_status_history: [{ created_at: '2026-10-10T00:00:00Z' }, { created_at: '2026-10-13T00:00:00Z' }],
    }, now)).toBe(true);
    expect(isApplicationOverdue({
      status: 'under_review', updated_at: '2026-10-01T00:00:00Z',
      application_status_history: [{ created_at: '2026-10-10T00:00:00Z' }, { created_at: '2026-10-16T00:00:00Z' }],
    }, now)).toBe(false);
  });

  it('falls back to updated_at when no history exists', () => {
    expect(isApplicationOverdue({ status: 'submitted', updated_at: '2026-10-13T13:09:00Z', application_status_history: [] }, now)).toBe(true);
    expect(isApplicationOverdue({ status: 'submitted', updated_at: null }, now)).toBe(false);
  });

  it.each(['approved', 'rejected', 'completed', 'cancelled'])('excludes terminal status %s', status => {
    expect(isApplicationOverdue({ status, updated_at: '2026-10-01T00:00:00Z' }, now)).toBe(false);
  });
});