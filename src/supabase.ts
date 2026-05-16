import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * SQL Schema for Supabase:
 * 
 * -- Users Table
 * create table users (
 *   uid text primary key,
 *   username text not null,
 *   email text not null,
 *   role text check (role in ('admin', 'user')) default 'user',
 *   balance bigint default 0,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Matches Table
 * create table matches (
 *   id uuid default gen_random_uuid() primary key,
 *   teama text not null,
 *   logoa text,
 *   teamb text not null,
 *   logob text,
 *   status text check (status in ('open', 'closed')) default 'open',
 *   resulta int,
 *   resultb int,
 *   deadline timestamp with time zone not null,
 *   totalprize bigint default 50000,
 *   winnercount int default 1,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Predictions Table
 * create table predictions (
 *   id uuid default gen_random_uuid() primary key,
 *   userid text references users(uid),
 *   matchid uuid references matches(id),
 *   scorea int not null,
 *   scoreb int not null,
 *   status text check (status in ('pending', 'won', 'lost')) default 'pending',
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Withdrawals Table
 * create table withdrawals (
 *   id uuid default gen_random_uuid() primary key,
 *   userid text references users(uid),
 *   amount bigint not null,
 *   status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Settings Table
 * create table settings (
 *   id text primary key default 'config',
 *   webname text not null,
 *   adminemail text not null,
 *   adminpassword text,
 *   isinstalled boolean default true,
 *   installedat timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- RLS POLICIES (Run these in Supabase SQL Editor)
 * 
 * -- Enable RLS
 * alter table users enable row level security;
 * alter table matches enable row level security;
 * alter table predictions enable row level security;
 * alter table withdrawals enable row level security;
 * alter table settings enable row level security;
 * 
 * -- Users Policies
 * create policy "Public profiles are viewable by everyone." on users for select using (true);
 * create policy "Users can update own profile." on users for update using (auth.uid()::text = uid);
 * create policy "Users can insert own profile." on users for insert with check (auth.uid()::text = uid);
 * 
 * -- Matches Policies
 * create policy "Matches are viewable by everyone." on matches for select using (true);
 * create policy "Admins can manage matches." on matches for all using (
 *   exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
 * );
 * 
 * -- Predictions Policies
 * create policy "Users can view own predictions." on predictions for select using (auth.uid()::text = userId);
 * create policy "Users can insert own predictions." on predictions for insert with check (auth.uid()::text = userId);
 * create policy "Admins can view all predictions." on predictions for select using (
 *   exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
 * );
 * create policy "Admins can update predictions." on predictions for update using (
 *   exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
 * );
 * 
 * -- Withdrawals Policies
 * create policy "Users can view own withdrawals." on withdrawals for select using (auth.uid()::text = userId);
 * create policy "Users can insert own withdrawals." on withdrawals for insert with check (auth.uid()::text = userId);
 * create policy "Admins can manage withdrawals." on withdrawals for all using (
 *   exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
 * );
 * 
 * -- Settings Policies
 * create policy "Settings are viewable by everyone." on settings for select using (true);
 * create policy "Admins can manage settings." on settings for all using (
 *   exists (select 1 from users where uid = auth.uid()::text and role = 'admin')
 * );
 */
