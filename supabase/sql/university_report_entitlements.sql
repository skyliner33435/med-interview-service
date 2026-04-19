-- 大学ごとのレポート閲覧権
-- Supabase Dashboard → SQL Editor で「全体」をコピーして実行してください。
-- 予約語: university_name = 'all_universities' は全大学閲覧（管理者承認時に投稿者へ付与）
-- 既に同名テーブルがある場合は先にバックアップのうえ drop するか、下の DROP のコメントを外してください。

-- drop table if exists public.university_report_entitlements cascade;

create table if not exists public.university_report_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  university_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, university_name)
);

create index if not exists university_report_entitlements_user_id_idx
  on public.university_report_entitlements (user_id);

alter table public.university_report_entitlements enable row level security;

drop policy if exists "university_report_entitlements_select_own" on public.university_report_entitlements;
drop policy if exists "university_report_entitlements_insert_own" on public.university_report_entitlements;
drop policy if exists "university_report_entitlements_update_own" on public.university_report_entitlements;

create policy "university_report_entitlements_select_own"
  on public.university_report_entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "university_report_entitlements_insert_own"
  on public.university_report_entitlements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "university_report_entitlements_update_own"
  on public.university_report_entitlements
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 管理者が他ユーザーの閲覧権を付与（承認時の all_universities 等）
-- メールは app/lib/adminConfig.ts の ADMIN_EMAILS と一致させる
drop policy if exists "university_report_entitlements_insert_admin" on public.university_report_entitlements;
drop policy if exists "university_report_entitlements_update_admin" on public.university_report_entitlements;

create policy "university_report_entitlements_insert_admin"
  on public.university_report_entitlements
  for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'skyliner33435@gmail.com');

create policy "university_report_entitlements_update_admin"
  on public.university_report_entitlements
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'skyliner33435@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'skyliner33435@gmail.com');
