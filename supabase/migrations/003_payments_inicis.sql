-- KG이니시스 직접 연동 결제 기록 및 크레딧 지급 (service_role RPC)

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  package_id text not null,
  credits integer not null,
  amount_krw integer not null,
  provider text not null default 'inicis',
  order_id text not null,
  pg_tid text,
  status text not null default 'pending',
  credits_granted_at timestamptz,
  cancelled_at timestamptz,
  raw_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_order_id_unique unique (order_id),
  constraint payments_status_check check (
    status in ('pending', 'paid', 'cancelled', 'failed')
  )
);

create index if not exists payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "payments_insert_own"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- 승인 검증 후 크레딧 지급 (멱등). 오직 service_role.
create or replace function public.service_complete_inicis_payment(
  p_order_id text,
  p_user_id uuid,
  p_pg_tid text,
  p_raw jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.payments%rowtype;
  v_new_credits int;
begin
  select * into v
  from public.payments
  where order_id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment_not_found');
  end if;

  if v.user_id is distinct from p_user_id then
    return jsonb_build_object('ok', false, 'error', 'user_mismatch');
  end if;

  if v.status = 'paid' then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'credits', (select credits from public.profiles where id = p_user_id)
    );
  end if;

  if v.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'invalid_status', 'status', v.status);
  end if;

  update public.profiles
  set credits = credits + v.credits
  where id = v.user_id
  returning credits into v_new_credits;

  insert into public.credit_logs (user_id, amount, type, reason, metadata)
  values (
    v.user_id,
    v.credits,
    'grant',
    'payment_purchase',
    jsonb_build_object(
      'payment_id', v.id,
      'order_id', v.order_id,
      'pg_tid', p_pg_tid,
      'package_id', v.package_id,
      'provider', 'inicis'
    )
  );

  update public.payments
  set
    status = 'paid',
    pg_tid = p_pg_tid,
    credits_granted_at = now(),
    raw_snapshot = coalesce(p_raw, raw_snapshot),
    updated_at = now()
  where id = v.id;

  return jsonb_build_object('ok', true, 'credits', v_new_credits);
end;
$$;

-- INIAPI 환불 성공 후 크레딧 회수 (보유 크레딧 부족 시 실패)
create or replace function public.service_refund_inicis_payment(
  p_order_id text,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.payments%rowtype;
  v_bal int;
  v_new_credits int;
begin
  select * into v
  from public.payments
  where order_id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment_not_found');
  end if;

  if v.user_id is distinct from p_user_id then
    return jsonb_build_object('ok', false, 'error', 'user_mismatch');
  end if;

  if v.status <> 'paid' then
    return jsonb_build_object('ok', false, 'error', 'not_paid', 'status', v.status);
  end if;

  select credits into v_bal from public.profiles where id = p_user_id;
  if v_bal is null then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if v_bal < v.credits then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits_to_refund',
      'balance', v_bal,
      'required', v.credits
    );
  end if;

  update public.profiles
  set credits = credits - v.credits
  where id = p_user_id
  returning credits into v_new_credits;

  insert into public.credit_logs (user_id, amount, type, reason, metadata)
  values (
    p_user_id,
    -v.credits,
    'refund',
    'payment_refund',
    jsonb_build_object(
      'payment_id', v.id,
      'order_id', v.order_id,
      'package_id', v.package_id
    )
  );

  update public.payments
  set
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  where id = v.id;

  return jsonb_build_object('ok', true, 'credits', v_new_credits);
end;
$$;

-- 관리자/배치 동기화용: 이미 PG에서 취소된 건 로컬 paid 상태 회수
create or replace function public.service_revoke_paid_inicis_payment(
  p_order_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.payments%rowtype;
  v_bal int;
  v_new_credits int;
begin
  select * into v from public.payments where order_id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'no_row');
  end if;
  if v.status <> 'paid' then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'not_paid');
  end if;

  select credits into v_bal from public.profiles where id = v.user_id;
  if coalesce(v_bal, 0) < v.credits then
    return jsonb_build_object(
      'ok', false,
      'error', 'insufficient_credits_to_revoke',
      'user_id', v.user_id
    );
  end if;

  update public.profiles set credits = credits - v.credits where id = v.user_id returning credits into v_new_credits;
  insert into public.credit_logs (user_id, amount, type, reason, metadata)
  values (
    v.user_id,
    -v.credits,
    'refund',
    'payment_cancelled_sync',
    jsonb_build_object('payment_id', v.id, 'order_id', v.order_id)
  );
  update public.payments
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = v.id;

  return jsonb_build_object('ok', true, 'credits', v_new_credits);
end;
$$;

revoke all on function public.service_complete_inicis_payment(text, uuid, text, jsonb) from public;
revoke all on function public.service_refund_inicis_payment(text, uuid) from public;
revoke all on function public.service_revoke_paid_inicis_payment(text) from public;

grant execute on function public.service_complete_inicis_payment(text, uuid, text, jsonb) to service_role;
grant execute on function public.service_refund_inicis_payment(text, uuid) to service_role;
grant execute on function public.service_revoke_paid_inicis_payment(text) to service_role;
