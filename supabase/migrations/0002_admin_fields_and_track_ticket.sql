-- Add admin/maintenance fields + improve public tracking payload for realtime.

alter table public.reports
add column if not exists admin_notes text,
add column if not exists assigned_team text;

-- Replace track_ticket to include report_id (uuid) for realtime subscriptions.
create or replace function public.track_ticket(p_ticket_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reports;
  updates jsonb;
begin
  select *
  into r
  from public.reports
  where ticket_id = p_ticket_id
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'status', u.status,
        'note', u.note,
        'created_at', u.created_at
      )
      order by u.created_at asc
    ),
    '[]'::jsonb
  )
  into updates
  from public.report_updates u
  where u.report_id = r.id;

  return jsonb_build_object(
    'found', true,
    'report_id', r.id,
    'ticket_id', r.ticket_id,
    'issue_type', r.issue_type,
    'severity', r.severity,
    'status', r.status,
    'image_url', r.image_url,
    'latitude', r.latitude,
    'longitude', r.longitude,
    'address', r.address,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'updates', updates
  );
end;
$$;

grant execute on function public.track_ticket(text) to anon, authenticated;

