import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const migrationUrl = new URL(
  '../../../supabase/migrations/20260802120000_add_daily_planner_event_end_date.sql',
  import.meta.url,
);

async function migration() {
  return (await readFile(migrationUrl, 'utf8')).toLowerCase();
}

describe('daily planner multi-day migration', () => {
  it('is additive and does not mutate data or authorization rules', async () => {
    const sql = await migration();

    expect(sql).not.toMatch(/\bdrop\b/);
    expect(sql).not.toMatch(/\b(update|delete|truncate|insert)\b/);
    expect(sql).not.toMatch(/\b(create|alter|drop)\s+policy\b/);
    expect(sql).not.toMatch(/\b(grant|revoke)\b/);
    expect(sql).not.toMatch(/\b(create|alter|drop)\s+trigger\b/);
  });

  it('adds a nullable date without a default and the inclusive range check', async () => {
    const sql = await migration();

    expect(sql).toMatch(/add column\s+end_date\s+date\s*;/);
    expect(sql).not.toMatch(/add column\s+end_date[\s\S]*?\bdefault\b/);
    expect(sql).toContain('daily_planner_events_end_date_not_before_date_check');
    expect(sql).toContain('check (end_date is null or end_date >= date)');
  });

  it('adds both requested owner-date indexes', async () => {
    const sql = await migration();

    expect(sql).toContain('daily_planner_events_user_id_date_idx');
    expect(sql).toContain('on public.daily_planner_events (user_id, date)');
    expect(sql).toContain('daily_planner_events_user_id_end_date_idx');
    expect(sql).toContain('on public.daily_planner_events (user_id, end_date)');
    expect(sql).toContain('where end_date is not null');
    expect(sql.match(/create index if not exists/g)).toHaveLength(2);
  });
});
