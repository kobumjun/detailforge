-- DetailForge initial schema
-- Run in Supabase SQL Editor or via CLI

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  credits integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Credits change only via consume_credit / refund_credit (security definer), not direct client updates.

-- Generations
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_description text not null,
  options jsonb not null default '{}'::jsonb,
  output_json jsonb,
  output_url text,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);

alter table public.generations enable row level security;

create policy "generations_select_own"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "generations_insert_own"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "generations_update_own"
  on public.generations for update
  using (auth.uid() = user_id);

-- Credit logs
create table if not exists public.credit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  type text not null,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_logs_user_id_created_at_idx
  on public.credit_logs (user_id, created_at desc);

alter table public.credit_logs enable row level security;

create policy "credit_logs_select_own"
  on public.credit_logs for select
  using (auth.uid() = user_id);

-- Payment orders (PG / LemonSqueezy later)
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'mock',
  status text not null default 'pending',
  credits_requested integer not null,
  external_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.payment_orders enable row level security;

create policy "payment_orders_select_own"
  on public.payment_orders for select
  using (auth.uid() = user_id);

create policy "payment_orders_insert_own"
  on public.payment_orders for insert
  with check (auth.uid() = user_id);

-- Optional: uploaded asset refs per generation
create table if not exists public.generation_images (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid references public.generations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  public_url text,
  created_at timestamptz not null default now()
);

alter table public.generation_images enable row level security;

create policy "generation_images_select_own"
  on public.generation_images for select
  using (auth.uid() = user_id);

create policy "generation_images_insert_own"
  on public.generation_images for insert
  with check (auth.uid() = user_id);

-- New user: 2 credits
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 2)
  on conflict (id) do update
    set email = excluded.email;
  insert into public.credit_logs (user_id, amount, type, reason)
  values (new.id, 2, 'grant', 'signup_bonus');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Consume credits (atomic)
create or replace function public.consume_credit(p_amount integer default 1, p_reason text default 'generation')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  update public.profiles
  set credits = credits - p_amount
  where id = v_uid and credits >= p_amount
  returning credits into v_new;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'insufficient_credits');
  end if;

  insert into public.credit_logs (user_id, amount, type, reason)
  values (v_uid, -p_amount, 'consume', p_reason);

  return jsonb_build_object('ok', true, 'credits', v_new);
end;
$$;

grant execute on function public.consume_credit(integer, text) to authenticated;

-- Refund credits (e.g. generation failed after charge)
create or replace function public.refund_credit(p_amount integer, p_reason text default 'refund')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  update public.profiles
  set credits = credits + p_amount
  where id = v_uid
  returning credits into v_new;

  insert into public.credit_logs (user_id, amount, type, reason)
  values (v_uid, p_amount, 'refund', p_reason);

  return jsonb_build_object('ok', true, 'credits', v_new);
end;
$$;

grant execute on function public.refund_credit(integer, text) to authenticated;

-- Storage buckets (private)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- Storage RLS: users can manage files under their user id folder
create policy "uploads_select_own"
  on storage.objects for select
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads_update_own"
  on storage.objects for update
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads_delete_own"
  on storage.objects for delete
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "exports_select_own"
  on storage.objects for select
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "exports_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);

-- Service role uploads to exports (optional): use signed URLs from API with user JWT instead.
-- For MVP, server uses user-scoped path with user session + RLS on insert.
