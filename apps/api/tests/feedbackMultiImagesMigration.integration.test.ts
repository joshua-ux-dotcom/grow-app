import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

function guardedUrl(): string {
  const value = process.env.TEST_DATABASE_URL;
  if (!value || process.env.ALLOW_INTEGRATION_DB_RESET !== 'true') throw new Error('Guarded local integration database configuration is required.');
  const url = new URL(value);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== '55432' || url.pathname !== '/grow_api_integration_test') {
    throw new Error('Feedback migration tests only allow localhost:55432/grow_api_integration_test.');
  }
  if (process.env.DATABASE_URL === value) throw new Error('TEST_DATABASE_URL must not equal DATABASE_URL.');
  return value;
}

describe('feedback multi-image PostgreSQL migration', () => {
  let pool: Pool;
  const ownerId = randomUUID(); const otherId = randomUUID(); const adminId = randomUUID(); const ceoId = randomUUID();
  let rpcBefore = '';
  let privilegesBefore: Array<{ grantee: string; privilege_type: string }> = [];

  beforeAll(async () => {
    pool = new Pool({ connectionString: guardedUrl() });
    await pool.query(`
      create schema if not exists auth; create schema if not exists storage;
      do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
      drop table if exists storage.objects cascade; drop table if exists public.feedback cascade; drop table if exists public.profiles cascade;
      create table public.feedback (id uuid primary key, image_url text null, image_path text null);
      create table public.profiles (id uuid primary key, role text not null);
      create table storage.objects (id uuid primary key, bucket_id text not null, name text not null);
      create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create or replace function storage.foldername(text) returns text[] language sql immutable as $$
        select case when array_length(string_to_array($1, '/'), 1) > 1
          then (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'), 1)-1] else array[]::text[] end
      $$;
      create function public.get_admin_feedback_list(limit_count integer) returns integer language sql as $$ select limit_count $$;
      alter table storage.objects enable row level security;
      create policy feedback_images_existing_read on storage.objects for select to authenticated using (bucket_id = 'feedback-images');
      create policy feedback_images_existing_upload on storage.objects for insert to authenticated with check (bucket_id = 'feedback-images');
      grant usage on schema auth, storage, public to authenticated;
      grant select, delete on storage.objects to authenticated; grant select on public.profiles to authenticated;
      insert into public.feedback (id, image_url, image_path) values ('${randomUUID()}', 'https://legacy', '${ownerId}/legacy.jpg');
      insert into public.profiles values ('${adminId}', 'admin'), ('${ceoId}', 'ceo');
    `);
    rpcBefore = (await pool.query("select pg_get_functiondef('public.get_admin_feedback_list(integer)'::regprocedure) as definition")).rows[0].definition;
    privilegesBefore = (await pool.query("select grantee, privilege_type from information_schema.role_table_grants where table_schema='storage' and table_name='objects' and grantee='authenticated' order by privilege_type")).rows;
    const sql = await readFile(new URL('../../../supabase/migrations/20260804120000_add_feedback_image_arrays.sql', import.meta.url), 'utf8');
    await pool.query(sql);
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query('drop table if exists storage.objects cascade; drop table if exists public.feedback cascade; drop table if exists public.profiles cascade; drop function if exists public.get_admin_feedback_list(integer)');
    await pool.end();
  });

  it('keeps legacy rows valid and allows paired null arrays', async () => {
    await pool.query('insert into public.feedback (id, image_url, image_path) values ($1,$2,$3)', [randomUUID(), 'https://legacy-after', `${ownerId}/legacy-after.jpg`]);
    const rows = await pool.query('select image_url, image_path, image_urls, image_paths from public.feedback');
    expect(rows.rows).toEqual(expect.arrayContaining([
      { image_url: 'https://legacy', image_path: `${ownerId}/legacy.jpg`, image_urls: null, image_paths: null },
      { image_url: 'https://legacy-after', image_path: `${ownerId}/legacy-after.jpg`, image_urls: null, image_paths: null },
    ]));
  });

  it('enforces presence, equal 1..5 cardinality and no null elements', async () => {
    const valid = [1, 2, 3, 4, 5].map(count => Array.from({ length: count }, (_, index) => `v${index}`));
    for (const values of valid) await expect(pool.query('insert into public.feedback (id,image_urls,image_paths) values ($1,$2,$2)', [randomUUID(), values])).resolves.toBeDefined();
    const invalid = [
      [['url'], null], [null, ['path']], [[], []],
      [Array(6).fill('url'), Array(6).fill('path')], [['a'], ['a', 'b']], [['a', null], ['a', 'b']],
    ];
    for (const [urls, paths] of invalid) await expect(pool.query('insert into public.feedback (id,image_urls,image_paths) values ($1,$2,$3)', [randomUUID(), urls, paths])).rejects.toMatchObject({ code: '23514' });
  });

  it('preserves the existing RPC and read policy while adding only the two delete policies', async () => {
    const rpcAfter = (await pool.query("select pg_get_functiondef('public.get_admin_feedback_list(integer)'::regprocedure) as definition")).rows[0].definition;
    expect(rpcAfter).toBe(rpcBefore);
    const policies = await pool.query("select policyname, cmd, roles from pg_policies where schemaname='storage' and tablename='objects' order by policyname");
    expect(policies.rows.map(row => row.policyname)).toEqual(['feedback_images_existing_read', 'feedback_images_existing_upload', 'grow_feedback_images_delete_admin_20260804', 'grow_feedback_images_delete_own_20260804']);
    const privilegesAfter = (await pool.query("select grantee, privilege_type from information_schema.role_table_grants where table_schema='storage' and table_name='objects' and grantee='authenticated' order by privilege_type")).rows;
    expect(privilegesAfter).toEqual(privilegesBefore);
  });

  it('allows own-folder deletion, blocks ordinary cross-owner deletion and allows admin and CEO', async () => {
    const ownObject = randomUUID(); const otherObject = randomUUID(); const adminObject = randomUUID(); const ceoObject = randomUUID();
    await pool.query('insert into storage.objects values ($1,$4,$2),($3,$4,$5),($6,$4,$7),($8,$4,$9)', [
      ownObject, `${ownerId}/own.jpg`, otherObject, 'feedback-images', `${otherId}/other.jpg`, adminObject, `${otherId}/admin.jpg`, ceoObject, `${otherId}/ceo.jpg`,
    ]);
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query('set local role authenticated');
      await client.query('select set_config($1,$2,true)', ['request.jwt.claim.sub', ownerId]);
      expect((await client.query('delete from storage.objects where id=$1 returning id', [ownObject])).rowCount).toBe(1);
      expect((await client.query('delete from storage.objects where id=$1 returning id', [otherObject])).rowCount).toBe(0);
      await client.query('rollback');
      await client.query('begin');
      await client.query('set local role authenticated');
      await client.query('select set_config($1,$2,true)', ['request.jwt.claim.sub', adminId]);
      expect((await client.query('delete from storage.objects where id=$1 returning id', [adminObject])).rowCount).toBe(1);
      await client.query('rollback');
      await client.query('begin');
      await client.query('set local role authenticated');
      await client.query('select set_config($1,$2,true)', ['request.jwt.claim.sub', ceoId]);
      expect((await client.query('delete from storage.objects where id=$1 returning id', [ceoObject])).rowCount).toBe(1);
      await client.query('rollback');
    } finally { client.release(); }
  });
});
