-- ============================================================
-- AULACONECTA: CHAT DIRECTO ENTRE USUARIOS
-- Ejecutar completo en Supabase > SQL Editor.
-- Es idempotente: puede ejecutarse nuevamente sin borrar mensajes.
-- ============================================================

-- Los usuarios autenticados deben poder encontrar perfiles públicos.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'chat_authenticated_users_can_view_profiles'
  ) then
    create policy chat_authenticated_users_can_view_profiles
      on public.profiles for select
      to authenticated
      using (true);
  end if;
end $$;

-- Helper seguro para evitar recursión en políticas de conversation_members.
create or replace function public.is_conversation_member(target_conversation_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_member(bigint) to authenticated;

-- Crear o recuperar un chat privado entre exactamente dos usuarios.
drop function if exists public.get_or_create_direct_conversation(uuid);
create function public.get_or_create_direct_conversation(target_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  found_conversation_id bigint;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para enviar mensajes.';
  end if;

  if target_user_id is null or target_user_id = current_user_id then
    raise exception 'Selecciona otro usuario.';
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'El usuario seleccionado no existe.';
  end if;

  select c.id
  into found_conversation_id
  from public.conversations c
  where public.is_conversation_member(c.id)
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = c.id
        and cm.user_id = target_user_id
    )
    and (
      select count(*) from public.conversation_members cm2
      where cm2.conversation_id = c.id
    ) = 2
  order by c.created_at desc
  limit 1;

  if found_conversation_id is not null then
    return found_conversation_id;
  end if;

  insert into public.conversations default values
  returning id into found_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (found_conversation_id, current_user_id),
    (found_conversation_id, target_user_id);

  return found_conversation_id;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- RLS activado.
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Políticas únicas para lectura de conversaciones y miembros.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='conversations'
      and policyname='chat_members_can_view_conversations'
  ) then
    create policy chat_members_can_view_conversations
      on public.conversations for select to authenticated
      using (public.is_conversation_member(id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='conversation_members'
      and policyname='chat_members_can_view_members'
  ) then
    create policy chat_members_can_view_members
      on public.conversation_members for select to authenticated
      using (public.is_conversation_member(conversation_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='messages'
      and policyname='chat_members_can_view_messages'
  ) then
    create policy chat_members_can_view_messages
      on public.messages for select to authenticated
      using (public.is_conversation_member(conversation_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='messages'
      and policyname='chat_members_can_send_messages'
  ) then
    create policy chat_members_can_send_messages
      on public.messages for insert to authenticated
      with check (
        sender_id = auth.uid()
        and public.is_conversation_member(conversation_id)
      );
  end if;
end $$;

-- Asegurar permisos básicos a usuarios autenticados.
grant select on public.profiles to authenticated;
grant select on public.conversations to authenticated;
grant select on public.conversation_members to authenticated;
grant select, insert on public.messages to authenticated;

-- Realtime para mensajes (ignora si ya fue agregado).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
