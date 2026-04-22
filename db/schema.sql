-- Minimal Supabase schema for the College Sim v0 demo.
-- Demo-only note: policies are intentionally permissive because there is no auth flow yet.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  status text not null default 'active' check (status in ('active', 'completed')),
  current_year integer not null check (current_year >= 1 and current_year <= 8),
  current_month integer not null check (current_month >= 1 and current_month <= 12),
  profile_json jsonb not null,
  current_state_json jsonb not null
);

drop trigger if exists runs_set_updated_at on public.runs;
create trigger runs_set_updated_at
before update on public.runs
for each row
execute function public.set_updated_at();

create table if not exists public.monthly_states (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  year integer not null check (year >= 1 and year <= 8),
  month integer not null check (month >= 1 and month <= 12),
  snapshot_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (run_id, year, month)
);

create table if not exists public.game_event_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  year integer not null check (year >= 1 and year <= 8),
  month integer not null check (month >= 1 and month <= 12),
  log_type text not null check (log_type in ('action', 'event', 'settlement')),
  message text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  year integer not null check (year >= 1 and year <= 8),
  month integer check (month is null or (month >= 1 and month <= 12)),
  report_type text not null check (report_type in ('monthly_journal', 'ending_report')),
  input_summary_json jsonb not null,
  output_markdown text not null,
  model text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resume_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  year integer not null check (year >= 1 and year <= 8),
  month integer not null check (month >= 1 and month <= 12),
  category text not null check (category in ('internship', 'project', 'campus_activity', 'special_experience', 'job_progress')),
  title text not null,
  summary text not null,
  source_item_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_runs_status on public.runs(status);
create index if not exists idx_monthly_states_run_period on public.monthly_states(run_id, year, month);
create index if not exists idx_game_event_logs_run_period on public.game_event_logs(run_id, year, month, created_at);
create index if not exists idx_ai_reports_run_type_period on public.ai_reports(run_id, report_type, year, month);
create index if not exists idx_resume_items_run_period on public.resume_items(run_id, year, month, created_at);

alter table public.runs enable row level security;
alter table public.monthly_states enable row level security;
alter table public.game_event_logs enable row level security;
alter table public.ai_reports enable row level security;
alter table public.resume_items enable row level security;

drop policy if exists "demo_full_access_runs" on public.runs;
create policy "demo_full_access_runs"
on public.runs
for all
using (true)
with check (true);

drop policy if exists "demo_full_access_monthly_states" on public.monthly_states;
create policy "demo_full_access_monthly_states"
on public.monthly_states
for all
using (true)
with check (true);

drop policy if exists "demo_full_access_game_event_logs" on public.game_event_logs;
create policy "demo_full_access_game_event_logs"
on public.game_event_logs
for all
using (true)
with check (true);

drop policy if exists "demo_full_access_ai_reports" on public.ai_reports;
create policy "demo_full_access_ai_reports"
on public.ai_reports
for all
using (true)
with check (true);

drop policy if exists "demo_full_access_resume_items" on public.resume_items;
create policy "demo_full_access_resume_items"
on public.resume_items
for all
using (true)
with check (true);
