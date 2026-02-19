-- Roles y entidades base
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references families(id) on delete set null,
  display_name text not null,
  role text not null check (role in ('parent','child')),
  coins int not null default 0,
  streak_count int not null default 0,
  last_streak_date date,
  avatar_choice text,
  created_at timestamptz not null default now()
);

create table if not exists chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  description text,
  frequency text not null check (frequency in ('daily','weekly','custom')),
  points int not null default 10,
  active_days int[] not null default '{1,2,3,4,5}',
  requires_parent_approval boolean not null default true,
  active boolean not null default true,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists chore_assignments (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references chores(id) on delete cascade,
  child_id uuid not null references profiles(id) on delete cascade,
  starts_on date not null default current_date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique(chore_id, child_id)
);

create table if not exists chore_completions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references chore_assignments(id) on delete cascade,
  completed_for_date date not null,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  completed_at timestamptz not null default now(),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  unique(assignment_id, completed_for_date)
);

create table if not exists streaks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references chore_assignments(id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_completed_date date,
  updated_at timestamptz not null default now(),
  unique(assignment_id)
);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  cost_coins int not null default 50,
  redeemed boolean not null default false,
  created_at timestamptz not null default now()
);

-- TODO: agregar RLS policies por family_id + role
