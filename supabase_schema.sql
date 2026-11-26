-- DRF ACADEMY — Supabase PostgreSQL jadval tuzilmasi
create table if not exists drf_users (
  id text primary key,
  full_name text not null,
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('student', 'mentor')),
  group_name text,
  created_at timestamptz default now()
);

create table if not exists drf_attempts (
  id text primary key,
  student_id text not null,
  student_name text not null,
  student_group text,
  topic_id text not null,
  topic_title text not null,
  started_at timestamptz,
  completed_at timestamptz default now(),
  duration_seconds int default 0,
  total_questions int not null,
  score int not null,
  percentage int not null,
  correct_count int not null,
  wrong_count int not null,
  unanswered_count int not null,
  pending_review_count int default 0,
  is_provisional boolean default false,
  is_retry_mode boolean default false,
  results jsonb not null
);

alter table drf_users enable row level security;
alter table drf_attempts enable row level security;
drop policy if exists "drf_users_all" on drf_users;
create policy "drf_users_all" on drf_users for all using (true) with check (true);
drop policy if exists "drf_attempts_all" on drf_attempts;
create policy "drf_attempts_all" on drf_attempts for all using (true) with check (true);
