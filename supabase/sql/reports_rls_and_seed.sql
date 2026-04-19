-- reports: テストデータ確認・RLS（管理者が SELECT/UPDATE できるようにする）
-- Supabase Dashboard → SQL Editor で実行してください。
-- （既に同名ポリシーがある場合は DROP してから再実行）

-- ---------------------------------------------------------------------------
-- 1) テストデータがあるか確認（結果に行が出ればデータあり）
-- ---------------------------------------------------------------------------
-- select id, created_at, university_name, status, submitted_by from public.reports order by created_at desc limit 20;

-- ---------------------------------------------------------------------------
-- 2) テスト行の投入（初回だけ必要なら、次の insert のコメントを外して 1 回実行）
--    RLS をバイパスする postgres ロールで実行するため SQL Editor で OK。
--    submitted_by が NOT NULL の場合は auth.users に存在する uuid に差し替え。
-- ---------------------------------------------------------------------------
-- insert into public.reports (
--   university_name,
--   year,
--   format,
--   content,
--   atmosphere,
--   score,
--   improvement,
--   status,
--   submitted_by
-- ) values (
--   'テスト大学（SQL投入）',
--   2026,
--   '個人面接',
--   'テスト用の質問・回答欄です。',
--   '落ち着いた雰囲気でした。',
--   '非開示',
--   '英語の準備を厚くする',
--   'pending',
--   null
-- );

-- ---------------------------------------------------------------------------
-- 3) RLS: 管理者メール（アプリの AdminClient と同じ）で全件読取・更新可
--    公開済みは anon でも読めるポリシー（任意）
-- ---------------------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists "reports_select_approved" on public.reports;
drop policy if exists "reports_select_published" on public.reports;
drop policy if exists "reports_select_admin" on public.reports;
drop policy if exists "reports_select_own" on public.reports;
drop policy if exists "reports_update_admin" on public.reports;
drop policy if exists "reports_insert_authenticated" on public.reports;

-- 承認済みレポートは誰でも参照可（一覧ページ等で使う場合）
-- 旧ポリシー名・値（published）から移行する場合は手動で drop してください。
create policy "reports_select_approved"
  on public.reports
  for select
  to anon, authenticated
  using (status = 'approved');

-- 管理者は全行参照可（メールは app/admin/AdminClient.tsx の isAdmin と一致させる）
create policy "reports_select_admin"
  on public.reports
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'skyliner33435@gmail.com');

-- ログインユーザーは自分の投稿を参照可（submitted_by が auth.uid() と一致）
-- submitted_by が uuid 型なら (submitted_by = auth.uid()) のみで十分なことが多いです。
create policy "reports_select_own"
  on public.reports
  for select
  to authenticated
  using (
    submitted_by is not null
    and (
      submitted_by = auth.uid()
      or submitted_by::text = auth.uid()::text
    )
  );

-- 投稿フォーム用: 自分の uid を submitted_by に入れた行だけ INSERT 可
create policy "reports_insert_authenticated"
  on public.reports
  for insert
  to authenticated
  with check (
    submitted_by is not null
    and (
      submitted_by = auth.uid()
      or submitted_by::text = auth.uid()::text
    )
  );

-- 管理画面の承認・却下
create policy "reports_update_admin"
  on public.reports
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'skyliner33435@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'skyliner33435@gmail.com');

-- ---------------------------------------------------------------------------
-- 注意:
-- - submitted_by が uuid 型でない / NULL 不可で insert が失敗する場合は、
--   実ユーザーの id を入れるか、カラム定義をアプリの SubmitClient に合わせて調整してください。
-- - ポリシー適用後も 0 件のときは、Console の [admin.reports] で error の有無を確認してください。
--   error なし・0 件 → テーブル空か、別メールでログインしている可能性があります。
