alter table chores
add column if not exists active_days int[] not null default '{1,2,3,4,5}';
