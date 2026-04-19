-- Storage バケット report-images と RLS（投稿者は自分のフォルダにのみアップロード可）
-- Supabase Dashboard → SQL Editor で実行してください。
-- （ダッシュボードの Storage で同名バケットを作った場合も、ポリシーだけ未設定ならこの SQL で足ります）

-- ---------------------------------------------------------------------------
-- 1) バケット作成（公開読み取り: 管理画面・公開ページで <img src=...> しやすい）
--    file_size_limit: 10MB（必要なら変更）
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do update set public = excluded.public;

-- ---------------------------------------------------------------------------
-- 2) storage.objects のポリシー
--    アップロードパス先頭フォルダ = auth.uid()（例: {uuid}/photo.jpg）
-- ---------------------------------------------------------------------------
drop policy if exists "report_images_insert_own" on storage.objects;
create policy "report_images_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "report_images_select_public" on storage.objects;
create policy "report_images_select_public"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'report-images');

-- 任意: 自分のフォルダ内オブジェクトのみ削除（再アップロード用）
drop policy if exists "report_images_delete_own" on storage.objects;
create policy "report_images_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
