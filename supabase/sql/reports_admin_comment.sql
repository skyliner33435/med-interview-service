-- 管理画面の差し戻しコメント用カラム
-- Supabase SQL Editor で実行してください。

alter table public.reports
  add column if not exists admin_comment text;

comment on column public.reports.admin_comment is '差し戻し時の管理者コメント（投稿者にメールで通知）';
