-- Enable RLS
alter table profiles enable row level security;
alter table families enable row level security;
alter table chores enable row level security;
alter table chore_assignments enable row level security;
alter table chore_completions enable row level security;
alter table wishlists enable row level security;

-- PROFILES: users can read/update only themselves
create policy if not exists profiles_select_self on profiles
for select using (auth.uid() = id);

create policy if not exists profiles_update_self on profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

-- FAMILIES: members of a family can read family
create policy if not exists families_select_member on families
for select using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and p.family_id = families.id
  )
);

-- CHORES: family members can read; only parents can create/update
create policy if not exists chores_select_family on chores
for select using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and p.family_id = chores.family_id
  )
);

create policy if not exists chores_insert_parent on chores
for insert with check (
  exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'parent' and p.family_id = chores.family_id
  )
);

create policy if not exists chores_update_parent on chores
for update using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'parent' and p.family_id = chores.family_id
  )
);

-- ASSIGNMENTS: family members read, parents manage
create policy if not exists assignments_select_family on chore_assignments
for select using (
  exists (
    select 1 from profiles me
    join chores c on c.id = chore_assignments.chore_id
    where me.id = auth.uid() and me.family_id = c.family_id
  )
);

create policy if not exists assignments_insert_parent on chore_assignments
for insert with check (
  exists (
    select 1 from profiles me
    join chores c on c.id = chore_assignments.chore_id
    where me.id = auth.uid() and me.role = 'parent' and me.family_id = c.family_id
  )
);

-- COMPLETIONS: child can insert own assignment completion; family can read; parent can update status
create policy if not exists completions_select_family on chore_completions
for select using (
  exists (
    select 1
    from chore_assignments a
    join chores c on c.id = a.chore_id
    join profiles me on me.id = auth.uid()
    where a.id = chore_completions.assignment_id and me.family_id = c.family_id
  )
);

create policy if not exists completions_insert_child on chore_completions
for insert with check (
  exists (
    select 1 from chore_assignments a where a.id = chore_completions.assignment_id and a.child_id = auth.uid()
  )
);

create policy if not exists completions_update_parent on chore_completions
for update using (
  exists (
    select 1
    from chore_assignments a
    join chores c on c.id = a.chore_id
    join profiles me on me.id = auth.uid()
    where a.id = chore_completions.assignment_id and me.role = 'parent' and me.family_id = c.family_id
  )
);

-- WISHLIST: child and parents in same family can read; parent creates/updates
create policy if not exists wishlist_select_family on wishlists
for select using (
  exists (
    select 1
    from profiles me
    join profiles child on child.id = wishlists.child_id
    where me.id = auth.uid() and me.family_id is not null and me.family_id = child.family_id
  )
);

create policy if not exists wishlist_insert_parent on wishlists
for insert with check (
  exists (
    select 1
    from profiles me
    join profiles child on child.id = wishlists.child_id
    where me.id = auth.uid() and me.role = 'parent' and me.family_id = child.family_id
  )
);

create policy if not exists wishlist_update_parent_or_child on wishlists
for update using (
  exists (
    select 1
    from profiles me
    join profiles child on child.id = wishlists.child_id
    where me.id = auth.uid() and me.family_id = child.family_id
  )
);
