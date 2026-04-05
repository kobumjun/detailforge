-- Optional metadata on credit consume (MVP: no full generation payload in DB)
drop function if exists public.consume_credit(integer, text);

create or replace function public.consume_credit(
  p_amount integer default 1,
  p_reason text default 'generation',
  p_metadata jsonb default null
)
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

  insert into public.credit_logs (user_id, amount, type, reason, metadata)
  values (v_uid, -p_amount, 'consume', p_reason, p_metadata);

  return jsonb_build_object('ok', true, 'credits', v_new);
end;
$$;

grant execute on function public.consume_credit(integer, text, jsonb) to authenticated;
