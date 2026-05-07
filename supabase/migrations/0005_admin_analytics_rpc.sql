-- Admin analytics RPC (grouped counts + trend)
-- Uses SECURITY DEFINER but explicitly checks role.

create or replace function public.admin_dashboard_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  by_status jsonb;
  by_severity jsonb;
  by_type jsonb;
  by_day jsonb;
  total_count bigint;
  open_count bigint;
  resolved_count bigint;
begin
  if not public.is_admin_or_maintenance() then
    raise exception 'not_authorized';
  end if;

  select count(*) into total_count from public.reports;
  select count(*) into open_count from public.reports where status in ('submitted','reviewed','assigned','in_progress');
  select count(*) into resolved_count from public.reports where status = 'resolved';

  select coalesce(jsonb_object_agg(status, count), '{}'::jsonb)
  into by_status
  from (
    select status, count(*)::bigint as count
    from public.reports
    group by status
  ) s;

  select coalesce(jsonb_object_agg(severity, count), '{}'::jsonb)
  into by_severity
  from (
    select severity, count(*)::bigint as count
    from public.reports
    group by severity
  ) s;

  select coalesce(jsonb_object_agg(issue_type, count), '{}'::jsonb)
  into by_type
  from (
    select issue_type, count(*)::bigint as count
    from public.reports
    group by issue_type
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'count', count) order by day), '[]'::jsonb)
  into by_day
  from (
    select to_char(d::date, 'YYYY-MM-DD') as day,
           coalesce(r.cnt, 0)::bigint as count
    from generate_series(current_date - interval '6 days', current_date, interval '1 day') d
    left join (
      select date_trunc('day', created_at)::date as day, count(*)::bigint as cnt
      from public.reports
      where created_at >= (current_date - interval '6 days')
      group by 1
    ) r using (day)
  ) t;

  return jsonb_build_object(
    'total', total_count,
    'open', open_count,
    'resolved', resolved_count,
    'by_status', by_status,
    'by_severity', by_severity,
    'by_type', by_type,
    'trend_7d', by_day
  );
end;
$$;

revoke all on function public.admin_dashboard_analytics() from public;
grant execute on function public.admin_dashboard_analytics() to authenticated;

