-- 1. Create Tables
create table if not exists users (
  uid text primary key,
  username text not null,
  email text not null,
  role text check (role in ('admin', 'user')) default 'user',
  balance bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  teama text not null,
  logoa text,
  teamb text not null,
  logob text,
  status text check (status in ('open', 'closed')) default 'open',
  resulta int,
  resultb int,
  deadline timestamp with time zone not null,
  totalprize bigint default 50000,
  winnercount int default 1,
  prizedistribution text default 'rata',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists predictions (
  id uuid default gen_random_uuid() primary key,
  userid text references users(uid),
  matchid uuid references matches(id),
  scorea int not null,
  scoreb int not null,
  status text check (status in ('pending', 'won', 'lost')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists withdrawals (
  id uuid default gen_random_uuid() primary key,
  userid text references users(uid),
  amount bigint not null,
  wallet text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists settings (
  id text primary key default 'config',
  webname text not null,
  adminemail text not null,
  adminpassword text,
  logo_url text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  banner_image_url text,
  banner_link_url text,
  isinstalled boolean default true,
  installedat timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  details text,
  admin_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure table alters for upgrades
alter table matches add column if not exists prizedistribution text default 'rata';
alter table settings add column if not exists banner_image_url text;
alter table settings add column if not exists banner_link_url text;

-- 2. Enable RLS
alter table users enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table withdrawals enable row level security;
alter table settings enable row level security;
alter table audit_logs enable row level security;

-- 3. Create Policies
drop policy if exists "Public profiles are viewable by everyone." on users;
create policy "Public profiles are viewable by everyone." on users for select using (true);

drop policy if exists "Users can update own profile." on users;
create policy "Users can update own profile." on users for update using (auth.uid()::text = uid);

drop policy if exists "Users can insert own profile." on users;
create policy "Users can insert own profile." on users for insert with check (auth.uid()::text = uid);

drop policy if exists "Matches are viewable by everyone." on matches;
create policy "Matches are viewable by everyone." on matches for select using (true);

drop policy if exists "Admins can manage matches." on matches;
create policy "Admins can manage matches." on matches for all using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

drop policy if exists "Users can view own predictions." on predictions;
create policy "Users can view own predictions." on predictions for select using (auth.uid()::text = userid);

drop policy if exists "Users can insert own predictions." on predictions;
create policy "Users can insert own predictions." on predictions for insert with check (auth.uid()::text = userid);

drop policy if exists "Admins can view all predictions." on predictions;
create policy "Admins can view all predictions." on predictions for select using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

drop policy if exists "Admins can update predictions." on predictions;
create policy "Admins can update predictions." on predictions for update using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

drop policy if exists "Users can view own withdrawals." on withdrawals;
create policy "Users can view own withdrawals." on withdrawals for select using (auth.uid()::text = userid);

drop policy if exists "Users can insert own withdrawals." on withdrawals;
create policy "Users can insert own withdrawals." on withdrawals for insert with check (auth.uid()::text = userid);

drop policy if exists "Admins can manage withdrawals." on withdrawals;
create policy "Admins can manage withdrawals." on withdrawals for all using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

drop policy if exists "Settings are viewable by everyone." on settings;
create policy "Settings are viewable by everyone." on settings for select using (true);

drop policy if exists "Admins can manage settings." on settings;
create policy "Admins can manage settings." on settings for all using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);

drop policy if exists "Admins can manage audit logs." on audit_logs;
create policy "Admins can manage audit logs." on audit_logs for all using (
  exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
);
