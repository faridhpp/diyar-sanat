insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-media','site-media',true,15728640,array['image/jpeg','image/png','image/webp','image/avif','application/pdf','video/mp4','video/webm'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy site_media_public_read on storage.objects for select to anon,authenticated using(bucket_id='site-media');
create policy site_media_staff_insert on storage.objects for insert to authenticated with check(bucket_id='site-media' and (select private.has_staff_role(array['manager','admin','seo'])));
create policy site_media_staff_update on storage.objects for update to authenticated using(bucket_id='site-media' and (select private.has_staff_role(array['manager','admin','seo']))) with check(bucket_id='site-media' and (select private.has_staff_role(array['manager','admin','seo'])));
create policy site_media_staff_delete on storage.objects for delete to authenticated using(bucket_id='site-media' and (select private.has_staff_role(array['manager','admin','seo'])));
