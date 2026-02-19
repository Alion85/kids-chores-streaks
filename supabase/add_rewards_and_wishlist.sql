alter table profiles add column if not exists coins int not null default 0;
alter table profiles add column if not exists streak_count int not null default 0;

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  cost_coins int not null default 50,
  redeemed boolean not null default false,
  created_at timestamptz not null default now()
);
