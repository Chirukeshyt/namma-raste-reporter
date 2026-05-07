-- Namma-Raste Reporter - initial schema + RLS
-- Apply in Supabase SQL editor or via Supabase CLI migrations.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'citizen' check (role in ('citizen', 'admin', 'maintenance')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Automatically create profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'citizen')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- helpers: role checks
-- ---------------------------------------------------------------------------
create or replace function public.is_admin_or_maintenance()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'maintenance')
  );
$$;

-- ---------------------------------------------------------------------------
-- reports + ticket id generation
-- ---------------------------------------------------------------------------
create sequence if not exists public.report_ticket_seq;

create or replace function public.generate_ticket_id()
returns text
language plpgsql
volatile
as $$
declare
  year_text text := to_char(now(), 'YYYY');
  seq_value bigint := nextval('public.report_ticket_seq');
begin
  return 'NR-' || year_text || '-' || lpad(seq_value::text, 6, '0');
end;
$$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  ticket_id text unique not null,
  user_id uuid not null references public.profiles (id) on delete restrict,
  issue_type text not null check (issue_type in ('pothole', 'streetlight')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  description text,
  image_url text,
  latitude numeric,
  longitude numeric,
  address text,
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewed', 'assigned', 'in_progress', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute procedure public.set_updated_at();

create or replace function public.set_ticket_id_if_missing()
returns trigger
language plpgsql
as $$
begin
  if new.ticket_id is null or length(new.ticket_id) = 0 then
    new.ticket_id = public.generate_ticket_id();
  end if;
  return new;
end;
$$;

drop trigger if exists set_reports_ticket_id on public.reports;
create trigger set_reports_ticket_id
before insert on public.reports
for each row execute procedure public.set_ticket_id_if_missing();

-- Citizens: create own report
create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (user_id = auth.uid());

-- Citizens: view own reports
create policy "reports_select_own"
on public.reports
for select
to authenticated
using (user_id = auth.uid());

-- Admin/maintenance: full access
create policy "reports_admin_select_all"
on public.reports
for select
to authenticated
using (public.is_admin_or_maintenance());

create policy "reports_admin_update_all"
on public.reports
for update
to authenticated
using (public.is_admin_or_maintenance())
with check (public.is_admin_or_maintenance());

-- ---------------------------------------------------------------------------
-- report_updates
-- ---------------------------------------------------------------------------
create table if not exists public.report_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  status text not null check (status in ('submitted', 'reviewed', 'assigned', 'in_progress', 'resolved', 'rejected')),
  note text,
  updated_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.report_updates enable row level security;

-- Admin/maintenance: insert updates for any report
create policy "report_updates_admin_insert"
on public.report_updates
for insert
to authenticated
with check (public.is_admin_or_maintenance() and updated_by = auth.uid());

-- Admin/maintenance: view all updates
create policy "report_updates_admin_select_all"
on public.report_updates
for select
to authenticated
using (public.is_admin_or_maintenance());

-- Citizens: view updates for their own reports
create policy "report_updates_select_own_report"
on public.report_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.reports r
    where r.id = report_updates.report_id
      and r.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Public ticket tracking RPC (limited fields)
-- Allows "anyone with a valid Ticket ID" to track without exposing user identity.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Storage (bucket + policies)
-- ---------------------------------------------------------------------------
-- Bucket: reports (private by default)
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- Only authenticated users can upload to their own folder: <uid>/...
create policy "reports_storage_upload_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Owners can read their own uploads
create policy "reports_storage_read_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin/maintenance can read all report images
create policy "reports_storage_admin_read_all"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'reports'
  and public.is_admin_or_maintenance()
);

