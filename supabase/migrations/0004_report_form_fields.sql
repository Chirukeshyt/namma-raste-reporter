-- Extra report fields for better triage

alter table public.reports
add column if not exists sub_type text,
add column if not exists road_context text,
add column if not exists landmark text,
add column if not exists is_hazard boolean not null default false;

