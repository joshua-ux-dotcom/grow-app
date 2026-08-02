import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

const expectedDatabaseName = 'grow_api_integration_test';

function guardedUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || process.env.ALLOW_INTEGRATION_DB_RESET !== 'true') {
    throw new Error('Guarded local integration database configuration is required.');
  }

  const url = new URL(value);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1'].includes(url.hostname)
    || url.port !== '55432'
    || url.pathname !== `/${expectedDatabaseName}`
  ) {
    throw new Error('Daily planner migration tests only allow 127.0.0.1:55432/grow_api_integration_test.');
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === value) {
    throw new Error('TEST_DATABASE_URL must not equal DATABASE_URL.');
  }

  return value;
}

describe('daily planner multi-day PostgreSQL migration', () => {
  let pool: Pool;
  const existingEventId = randomUUID();

  beforeAll(async () => {
    pool = new Pool({ connectionString: guardedUrl() });
    await pool.query('drop table if exists public.daily_planner_events cascade');
    await pool.query(`
      create table public.daily_planner_events (
        id uuid primary key,
        user_id uuid not null,
        date date not null
      )
    `);
    await pool.query(
      'insert into public.daily_planner_events (id, user_id, date) values ($1, $2, $3)',
      [existingEventId, randomUUID(), '2026-08-02'],
    );
    const sql = await readFile(
      new URL('../../../supabase/migrations/20260802120000_add_daily_planner_event_end_date.sql', import.meta.url),
      'utf8',
    );
    await pool.query(sql);
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query('drop table if exists public.daily_planner_events cascade');
    await pool.end();
  });

  it('keeps existing single-day rows valid and gives them a null end date', async () => {
    const result = await pool.query(
      'select date::text, end_date::text from public.daily_planner_events where id = $1',
      [existingEventId],
    );

    expect(result.rows).toEqual([{ date: '2026-08-02', end_date: null }]);
  });

  it('creates a nullable date column without a default', async () => {
    const result = await pool.query(`
      select is_nullable, column_default, data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'daily_planner_events'
        and column_name = 'end_date'
    `);

    expect(result.rows).toEqual([{
      is_nullable: 'YES',
      column_default: null,
      data_type: 'date',
    }]);
  });

  it('accepts null and an end date equal to the start date', async () => {
    await expect(pool.query(
      `insert into public.daily_planner_events (id, user_id, date, end_date)
       values ($1, $2, '2026-08-03', null), ($3, $2, '2026-08-04', '2026-08-04')`,
      [randomUUID(), randomUUID(), randomUUID()],
    )).resolves.toBeDefined();
  });

  it('rejects an end date before the start date', async () => {
    await expect(pool.query(
      `insert into public.daily_planner_events (id, user_id, date, end_date)
       values ($1, $2, '2026-08-05', '2026-08-04')`,
      [randomUUID(), randomUUID()],
    )).rejects.toMatchObject({ code: '23514' });
  });

  it('creates both requested indexes', async () => {
    const result = await pool.query(`
      select indexname, indexdef
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'daily_planner_events'
        and indexname in (
          'daily_planner_events_user_id_date_idx',
          'daily_planner_events_user_id_end_date_idx'
        )
      order by indexname
    `);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].indexdef).toContain('(user_id, date)');
    expect(result.rows[1].indexdef).toContain('(user_id, end_date) WHERE (end_date IS NOT NULL)');
  });
});
