import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const migrationUrl = new URL('../../../supabase/migrations/20260804120000_add_feedback_image_arrays.sql', import.meta.url);
const policyNames = [
  'grow_feedback_images_delete_own_20260804',
  'grow_feedback_images_delete_admin_20260804',
];

describe('feedback multi-image migration', () => {
  it('adds bounded paired arrays and only scoped delete policies', async () => {
    const sql = (await readFile(migrationUrl, 'utf8')).toLowerCase();
    expect(sql).toContain('add column image_urls text[] null');
    expect(sql).toContain('add column image_paths text[] null');
    expect(sql).toContain('cardinality(image_urls) between 1 and 5');
    expect(sql).toContain('cardinality(image_paths) between 1 and 5');
    expect(sql).toContain('cardinality(image_urls) = cardinality(image_paths)');
    expect(sql).toContain('array_position(image_urls, null) is null');
    expect(sql).toContain("bucket_id = 'feedback-images'");
    expect(sql).toContain("profiles.role in ('ceo', 'admin')");
    expect(sql).not.toMatch(/\b(update|insert|delete from|drop|alter column)\b/);
    expect(sql).not.toMatch(/\b(grant|revoke|create or replace function)\b/);
  });

  it.skipIf(!process.env.FEEDBACK_PUBLIC_SCHEMA_DUMP || !process.env.FEEDBACK_STORAGE_SCHEMA_DUMP)(
    'does not collide with policy names in configured read-only live dumps',
    async () => {
      const dumps = await Promise.all([
        readFile(process.env.FEEDBACK_PUBLIC_SCHEMA_DUMP!, 'utf8'),
        readFile(process.env.FEEDBACK_STORAGE_SCHEMA_DUMP!, 'utf8'),
      ]);
      const deployedSchema = dumps.join('\n').toLowerCase();
      for (const policyName of policyNames) expect(deployedSchema).not.toContain(policyName);
    },
  );
});
