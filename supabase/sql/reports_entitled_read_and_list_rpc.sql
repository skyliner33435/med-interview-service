-- 承認済みレポートの本文は「閲覧権」または管理者・投稿者本人のみ SELECT 可にする。
-- 一覧用メタデータ（id / 大学 / 年度 / 形式）は RPC（SECURITY DEFINER）で anon でも取得可。
-- Supabase SQL Editor で実行（既存の reports_select_approved がある前提）

drop policy if exists "reports_select_approved" on public.reports;

create policy "reports_select_approved_entitled"
  on public.reports
  for select
  to authenticated
  using (
    status = 'approved'
    and exists (
      select 1
      from public.university_report_entitlements e
      where e.user_id = auth.uid()
        and (
          e.university_name = reports.university_name
          or e.university_name = 'all_universities'
        )
    )
  );

-- 既存ポリシー（admin / own）は reports_rls_and_seed.sql のまま OR で併用されます。

create or replace function public.count_approved_reports_for_university(p_name text)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::bigint
  from public.reports
  where status = 'approved'
    and trim(university_name) = trim(p_name);
$$;

revoke all on function public.count_approved_reports_for_university(text) from public;
grant execute on function public.count_approved_reports_for_university(text) to anon, authenticated;

create or replace function public.approved_university_names()
returns table (university_name text)
language sql
security definer
set search_path = public
stable
as $$
  select distinct r.university_name
  from public.reports r
  where r.status = 'approved'
    and r.university_name is not null
    and trim(r.university_name) <> ''
  order by 1;
$$;

revoke all on function public.approved_university_names() from public;
grant execute on function public.approved_university_names() to anon, authenticated;

create or replace function public.approved_reports_public_list()
returns table (
  id uuid,
  university_name text,
  report_year integer,
  format text
)
language sql
security definer
set search_path = public
stable
as $$
  -- reports.year が text / integer いずれでも integer で返す（戻り型と一致させる）
  select
    r.id,
    r.university_name,
    (nullif(trim(both from r.year::text), ''))::integer as report_year,
    r.format
  from public.reports r
  where r.status = 'approved'
  order by
    r.university_name asc,
    (nullif(trim(both from r.year::text), ''))::integer desc nulls last,
    r.created_at desc;
$$;

revoke all on function public.approved_reports_public_list() from public;
grant execute on function public.approved_reports_public_list() to anon, authenticated;
