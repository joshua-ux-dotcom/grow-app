alter table public.feedback
  add column image_urls text[] null,
  add column image_paths text[] null;

alter table public.feedback
  add constraint feedback_image_arrays_presence_check
    check ((image_urls is null) = (image_paths is null)),
  add constraint feedback_image_urls_cardinality_check
    check (image_urls is null or cardinality(image_urls) between 1 and 5),
  add constraint feedback_image_paths_cardinality_check
    check (image_paths is null or cardinality(image_paths) between 1 and 5),
  add constraint feedback_image_arrays_equal_cardinality_check
    check (image_urls is null or cardinality(image_urls) = cardinality(image_paths)),
  add constraint feedback_image_urls_no_nulls_check
    check (image_urls is null or array_position(image_urls, null) is null),
  add constraint feedback_image_paths_no_nulls_check
    check (image_paths is null or array_position(image_paths, null) is null);

create policy "grow_feedback_images_delete_own_20260804"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'feedback-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "grow_feedback_images_delete_admin_20260804"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'feedback-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('ceo', 'admin')
  )
);
