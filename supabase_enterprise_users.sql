-- AULACONECTA ENTERPRISE FASE 2
-- Gestión de estados de cuenta, suspensión segura y auditoría administrativa.

begin;

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspension_reason text;

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended'));

create index if not exists profiles_account_status_idx
  on public.profiles(account_status, created_at desc);

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.account_status, 'active') = 'active'
  );
$$;

grant execute on function public.current_user_is_active() to authenticated;

create or replace function public.admin_set_user_status(
  target_user_id uuid,
  new_status text,
  target_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  updated_profile public.profiles;
begin
  select role into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role <> 'admin' then
    raise exception 'Solo un administrador puede cambiar el estado de una cuenta.';
  end if;

  if new_status not in ('active', 'suspended') then
    raise exception 'Estado de cuenta no válido.';
  end if;

  if target_user_id = auth.uid() and new_status = 'suspended' then
    raise exception 'No puedes suspender tu propia cuenta administrativa.';
  end if;

  update public.profiles
  set account_status = new_status,
      suspended_at = case when new_status = 'suspended' then now() else null end,
      suspended_by = case when new_status = 'suspended' then auth.uid() else null end,
      suspension_reason = case when new_status = 'suspended' then nullif(trim(target_reason), '') else null end
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'El usuario no existe.';
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, reason, metadata)
  values (
    auth.uid(),
    case when new_status = 'suspended' then 'user_suspended' else 'user_reactivated' end,
    'profile',
    target_user_id::text,
    nullif(trim(target_reason), ''),
    jsonb_build_object('new_status', new_status)
  );

  return updated_profile;
end;
$$;

grant execute on function public.admin_set_user_status(uuid, text, text) to authenticated;

-- Impide operaciones de escritura desde cuentas suspendidas incluso si conservan una sesión previa.
create or replace function public.enforce_active_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.current_user_is_active() then
    raise exception 'ACCOUNT_SUSPENDED: tu cuenta está suspendida.' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare
  table_name text;
  protected_tables text[] := array[
    'profiles', 'tutor_requests', 'tutor_applications', 'tutoring_sessions',
    'study_groups', 'group_members', 'reviews', 'materials', 'material_favorites',
    'notifications', 'conversations', 'conversation_members', 'messages', 'reports'
  ];
begin
  foreach table_name in array protected_tables loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists enforce_active_account_trigger on public.%I', table_name);
      execute format(
        'create trigger enforce_active_account_trigger before insert or update or delete on public.%I for each row execute function public.enforce_active_account()',
        table_name
      );
    end if;
  end loop;
end $$;

commit;
