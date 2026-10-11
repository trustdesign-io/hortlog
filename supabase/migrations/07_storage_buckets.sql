-- Public image buckets used by src/lib/storage.ts. They were missing in production, so uploads failed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif','image/avif']),
  ('org-logos', 'org-logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif','image/avif']),
  ('specimen-images', 'specimen-images', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif','image/avif'])
on conflict (id) do nothing;
