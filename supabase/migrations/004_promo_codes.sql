-- Simple partner/promo code system: one-time code, one-time per user

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  credits integer not null default 10,
  is_active boolean not null default true,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_codes_code_unique unique (code),
  constraint promo_codes_credits_positive check (credits > 0)
);

create unique index if not exists promo_codes_used_by_unique_idx
  on public.promo_codes (used_by)
  where used_by is not null;

create index if not exists promo_codes_created_at_idx
  on public.promo_codes (created_at desc);

alter table public.promo_codes enable row level security;

-- No direct read/write for authenticated users.
create policy "promo_codes_select_none"
  on public.promo_codes for select
  using (false);

create policy "promo_codes_insert_none"
  on public.promo_codes for insert
  with check (false);

create policy "promo_codes_update_none"
  on public.promo_codes for update
  using (false);

create or replace function public.service_redeem_promo_code(
  p_code text,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.promo_codes%rowtype;
  v_new_credits int;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select *
  into v
  from public.promo_codes
  where code = upper(trim(p_code))
    and is_active = true
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v.used_by is not null then
    return jsonb_build_object('ok', false, 'error', 'code_already_used');
  end if;

  if exists (
    select 1
    from public.promo_codes
    where used_by = p_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'user_already_used');
  end if;

  update public.profiles
  set credits = credits + v.credits
  where id = p_user_id
  returning credits into v_new_credits;

  if v_new_credits is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  update public.promo_codes
  set
    used_by = p_user_id,
    used_at = now(),
    updated_at = now()
  where id = v.id;

  insert into public.credit_logs (user_id, amount, type, reason, metadata)
  values (
    p_user_id,
    v.credits,
    'grant',
    'promo_code_bonus',
    jsonb_build_object(
      'promo_code_id', v.id,
      'promo_code', v.code
    )
  );

  return jsonb_build_object(
    'ok', true,
    'credits_added', v.credits,
    'credits', v_new_credits
  );
end;
$$;

revoke all on function public.service_redeem_promo_code(text, uuid) from public;
grant execute on function public.service_redeem_promo_code(text, uuid) to service_role;

insert into public.promo_codes (code, credits)
values
  ('DFP-WXFS-GJUG', 10),
  ('DFP-MMEA-LPAK', 10),
  ('DFP-J36U-STE7', 10),
  ('DFP-NEKS-KKY2', 10),
  ('DFP-TCCM-DAS7', 10),
  ('DFP-8K3N-KEJL', 10),
  ('DFP-S6JK-9BWZ', 10),
  ('DFP-HMZL-T7TL', 10),
  ('DFP-2BVQ-BEKM', 10),
  ('DFP-UQ54-FGZ9', 10),
  ('DFP-WMZL-PLMW', 10),
  ('DFP-56HG-SHYE', 10),
  ('DFP-QR79-69GB', 10),
  ('DFP-6EKC-H3WG', 10),
  ('DFP-7SX7-23NR', 10),
  ('DFP-MYSC-EEX6', 10),
  ('DFP-CMN7-9WKY', 10),
  ('DFP-8AKD-DPWN', 10),
  ('DFP-6ZCB-XSC7', 10),
  ('DFP-K6VC-BBHZ', 10),
  ('DFP-D66C-BCGM', 10),
  ('DFP-3E2B-5BHP', 10),
  ('DFP-UZSL-RQ4F', 10),
  ('DFP-J7RL-DC7Q', 10),
  ('DFP-H39M-7ZMJ', 10),
  ('DFP-TZEF-HNUT', 10),
  ('DFP-DH7G-R359', 10),
  ('DFP-WF8F-WBFV', 10),
  ('DFP-K62U-H3P5', 10),
  ('DFP-559B-EKBY', 10),
  ('DFP-794C-CY63', 10),
  ('DFP-2PDD-WM33', 10),
  ('DFP-D8K9-CERZ', 10),
  ('DFP-ARWB-Q3RD', 10),
  ('DFP-4YPX-GGJ8', 10),
  ('DFP-YS2U-MDR8', 10),
  ('DFP-VLTA-KFMA', 10),
  ('DFP-9BYV-C5XB', 10),
  ('DFP-DNYZ-9SRH', 10),
  ('DFP-QYLJ-UJU7', 10),
  ('DFP-D8KB-QRQX', 10),
  ('DFP-59CX-L2NV', 10),
  ('DFP-DHBY-ZXKT', 10),
  ('DFP-D596-V7FK', 10),
  ('DFP-LNCG-SFZC', 10),
  ('DFP-S58G-QQW6', 10),
  ('DFP-4EBG-X8PF', 10),
  ('DFP-79Q6-HCRQ', 10),
  ('DFP-9JE9-HTEQ', 10),
  ('DFP-EBHC-33UH', 10)
on conflict (code) do nothing;
