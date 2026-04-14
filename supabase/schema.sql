-- ============================================================
-- MANOR — Household Management App
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Owners see all profiles') then
    create policy "Owners see all profiles" on profiles
      for select using (
        auth.uid() = id
        or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Owners can insert profiles') then
    create policy "Owners can insert profiles" on profiles
      for insert with check (
        exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
        or auth.uid() = id
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Owners can update any profile') then
    create policy "Owners can update any profile" on profiles
      for update using (
        auth.uid() = id
        or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Owners can delete staff profiles') then
    create policy "Owners can delete staff profiles" on profiles
      for delete using (
        exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
      );
  end if;
end $$;

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- FLOORS
-- ============================================================
create table if not exists floors (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

alter table floors enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='floors' and policyname='Owners manage floors') then
    create policy "Owners manage floors" on floors
      for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='floors' and policyname='Staff can view floors') then
    create policy "Staff can view floors" on floors
      for select using (auth.uid() is not null);
  end if;
end $$;

-- ============================================================
-- ROOMS
-- ============================================================
create table if not exists rooms (
  id uuid default uuid_generate_v4() primary key,
  floor_id uuid references floors on delete cascade not null,
  name text not null,
  cover_photo_url text,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

alter table rooms enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='rooms' and policyname='Owners manage rooms') then
    create policy "Owners manage rooms" on rooms
      for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='rooms' and policyname='Staff can view rooms') then
    create policy "Staff can view rooms" on rooms
      for select using (auth.uid() is not null);
  end if;
end $$;

-- ============================================================
-- ITEMS
-- ============================================================
create table if not exists items (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms on delete cascade not null,
  name text not null,
  photo_url text,
  created_at timestamptz default now()
);

alter table items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='items' and policyname='Owners manage items') then
    create policy "Owners manage items" on items
      for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='items' and policyname='Staff can view items') then
    create policy "Staff can view items" on items
      for select using (auth.uid() is not null);
  end if;
end $$;

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  room_id uuid references rooms on delete cascade not null,
  item_id uuid references items on delete set null,
  recurrence_type text not null default 'daily'
    check (recurrence_type in ('daily', 'weekly', 'monthly', 'one_time')),
  recurrence_days integer[],
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table tasks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Owners manage tasks') then
    create policy "Owners manage tasks" on tasks
      for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Staff can view tasks') then
    create policy "Staff can view tasks" on tasks
      for select using (auth.uid() is not null);
  end if;
end $$;

-- ============================================================
-- TASK ASSIGNMENTS
-- ============================================================
create table if not exists task_assignments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks on delete cascade not null,
  assigned_to uuid references profiles on delete cascade not null,
  date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'blocked')),
  created_at timestamptz default now(),
  unique(task_id, date)
);

alter table task_assignments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_assignments' and policyname='Owners manage assignments') then
    create policy "Owners manage assignments" on task_assignments
      for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_assignments' and policyname='Staff can view own assignments') then
    create policy "Staff can view own assignments" on task_assignments
      for select using (assigned_to = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_assignments' and policyname='Staff can update own assignment status') then
    create policy "Staff can update own assignment status" on task_assignments
      for update using (assigned_to = auth.uid());
  end if;
end $$;

-- ============================================================
-- TASK COMPLETIONS
-- ============================================================
create table if not exists task_completions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references task_assignments on delete cascade not null unique,
  completed_at timestamptz default now(),
  proof_photo_url text,
  notes text
);

alter table task_completions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_completions' and policyname='Owners can view all completions') then
    create policy "Owners can view all completions" on task_completions
      for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_completions' and policyname='Staff can manage own completions') then
    create policy "Staff can manage own completions" on task_completions
      for all using (
        exists (
          select 1 from task_assignments ta
          where ta.id = assignment_id and ta.assigned_to = auth.uid()
        )
      );
  end if;
end $$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true) on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true) on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('completion-photos', 'completion-photos', true) on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true) on conflict do nothing;

-- Storage policies (skip if exist)
do $$ begin
  if not exists (select 1 from pg_policies where policyname='Authenticated users can upload room photos') then
    create policy "Authenticated users can upload room photos"
      on storage.objects for insert
      with check (bucket_id = 'room-photos' and auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='Public can view room photos') then
    create policy "Public can view room photos"
      on storage.objects for select using (bucket_id = 'room-photos');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='Authenticated users can upload item photos') then
    create policy "Authenticated users can upload item photos"
      on storage.objects for insert
      with check (bucket_id = 'item-photos' and auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='Public can view item photos') then
    create policy "Public can view item photos"
      on storage.objects for select using (bucket_id = 'item-photos');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='Authenticated users can upload completion photos') then
    create policy "Authenticated users can upload completion photos"
      on storage.objects for insert
      with check (bucket_id = 'completion-photos' and auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='Owners can view completion photos') then
    create policy "Owners can view completion photos"
      on storage.objects for select using (bucket_id = 'completion-photos');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='Authenticated users can upload avatars') then
    create policy "Authenticated users can upload avatars"
      on storage.objects for insert
      with check (bucket_id = 'avatars' and auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='Public can view avatars') then
    create policy "Public can view avatars"
      on storage.objects for select using (bucket_id = 'avatars');
  end if;
end $$;
