-- reports にレポート添付画像の公開 URL を保存
-- Supabase Dashboard → SQL Editor で実行してください。

alter table public.reports
  add column if not exists image_url text;

comment on column public.reports.image_url is
  'Supabase Storage バケット report-images に保存したファイルの公開 URL（任意・1枚）';
