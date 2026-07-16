-- ============================================================
-- AULACONECTA - CENTRO DE SOPORTE Y AYUDA
-- Ejecutar completo en Supabase SQL Editor.
-- ============================================================

create table if not exists public.support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(trim(subject)) between 5 and 140),
  category text not null check (category in (
    'Inicio de sesión','Perfil','Tutorías','Solicitudes','Materiales',
    'Grupos','Mensajería','Notificaciones','Seguridad','Sugerencias','Otros'
  )),
  description text not null check (char_length(trim(description)) between 10 and 4000),
  priority text not null default 'Media' check (priority in ('Baja','Media','Alta')),
  status text not null default 'Pendiente' check (status in ('Pendiente','En proceso','Resuelto','Cerrado')),
  assigned_admin uuid references public.profiles(id) on delete set null,
  satisfaction_rating smallint check (satisfaction_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx
  on public.support_tickets(user_id, created_at desc);
create index if not exists support_tickets_status_idx
  on public.support_tickets(status, priority, created_at desc);
create index if not exists support_messages_ticket_idx
  on public.support_messages(ticket_id, created_at asc);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists support_tickets_select_policy on public.support_tickets;
create policy support_tickets_select_policy
on public.support_tickets for select to authenticated
using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists support_tickets_insert_policy on public.support_tickets;
create policy support_tickets_insert_policy
on public.support_tickets for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists support_tickets_admin_update_policy on public.support_tickets;
create policy support_tickets_admin_update_policy
on public.support_tickets for update to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists support_messages_select_policy on public.support_messages;
create policy support_messages_select_policy
on public.support_messages for select to authenticated
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (t.user_id = auth.uid() or public.current_user_is_admin())
  )
);

drop policy if exists support_messages_insert_policy on public.support_messages;
create policy support_messages_insert_policy
on public.support_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and t.status <> 'Cerrado'
      and (t.user_id = auth.uid() or public.current_user_is_admin())
  )
);

create or replace function public.create_support_ticket(
  p_subject text,
  p_category text,
  p_description text,
  p_priority text default 'Media'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_id bigint;
  v_admin record;
begin
  if auth.uid() is null then
    raise exception 'No existe una sesión activa.' using errcode='42501';
  end if;

  insert into public.support_tickets(user_id, subject, category, description, priority)
  values (auth.uid(), trim(p_subject), p_category, trim(p_description), p_priority)
  returning id into v_ticket_id;

  for v_admin in
    select id from public.profiles
    where role = 'admin' or is_admin = true
  loop
    insert into public.notifications(
      user_id, notification_type, title, message,
      related_entity_type, related_entity_id, action_url, is_read
    ) values (
      v_admin.id, 'support', 'Nuevo ticket de soporte',
      'Se creó el ticket #' || v_ticket_id || ': ' || left(trim(p_subject), 90),
      'support_ticket', v_ticket_id, '/dashboard/soporte', false
    );
  end loop;

  return v_ticket_id;
end;
$$;

create or replace function public.add_support_message(
  p_ticket_id bigint,
  p_message text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_message_id bigint;
  v_admin record;
begin
  if auth.uid() is null then
    raise exception 'No existe una sesión activa.' using errcode='42501';
  end if;

  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id;

  if not found then
    raise exception 'El ticket no existe.' using errcode='P0002';
  end if;

  if v_ticket.status = 'Cerrado' then
    raise exception 'No se puede responder un ticket cerrado.' using errcode='22023';
  end if;

  if v_ticket.user_id <> auth.uid() and not public.current_user_is_admin() then
    raise exception 'No tienes acceso a este ticket.' using errcode='42501';
  end if;

  insert into public.support_messages(ticket_id, sender_id, message)
  values (p_ticket_id, auth.uid(), trim(p_message))
  returning id into v_message_id;

  update public.support_tickets
  set updated_at = now(),
      status = case
        when public.current_user_is_admin() and status = 'Pendiente' then 'En proceso'
        else status
      end,
      assigned_admin = case
        when public.current_user_is_admin() then coalesce(assigned_admin, auth.uid())
        else assigned_admin
      end
  where id = p_ticket_id;

  if public.current_user_is_admin() then
    insert into public.notifications(
      user_id, notification_type, title, message,
      related_entity_type, related_entity_id, action_url, is_read
    ) values (
      v_ticket.user_id, 'support', 'Tu ticket fue respondido',
      'Un administrador respondió el ticket #' || p_ticket_id || '.',
      'support_ticket', p_ticket_id, '/dashboard/soporte?ticket=' || p_ticket_id, false
    );
  else
    for v_admin in
      select id from public.profiles
      where role = 'admin' or is_admin = true
    loop
      insert into public.notifications(
        user_id, notification_type, title, message,
        related_entity_type, related_entity_id, action_url, is_read
      ) values (
        v_admin.id, 'support', 'Nueva respuesta en soporte',
        'El usuario respondió el ticket #' || p_ticket_id || '.',
        'support_ticket', p_ticket_id, '/dashboard/soporte?ticket=' || p_ticket_id, false
      );
    end loop;
  end if;

  return v_message_id;
end;
$$;

create or replace function public.admin_update_support_ticket(
  p_ticket_id bigint,
  p_status text,
  p_priority text,
  p_assigned_admin uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo los administradores pueden actualizar tickets.' using errcode='42501';
  end if;

  if p_status not in ('Pendiente','En proceso','Resuelto','Cerrado') then
    raise exception 'Estado no válido.' using errcode='22023';
  end if;

  if p_priority not in ('Baja','Media','Alta') then
    raise exception 'Prioridad no válida.' using errcode='22023';
  end if;

  update public.support_tickets
  set status = p_status,
      priority = p_priority,
      assigned_admin = coalesce(p_assigned_admin, assigned_admin, auth.uid()),
      resolved_at = case when p_status in ('Resuelto','Cerrado') then now() else null end,
      updated_at = now()
  where id = p_ticket_id
  returning user_id into v_user_id;

  if v_user_id is null then
    raise exception 'El ticket no existe.' using errcode='P0002';
  end if;

  insert into public.notifications(
    user_id, notification_type, title, message,
    related_entity_type, related_entity_id, action_url, is_read
  ) values (
    v_user_id, 'support', 'Estado de ticket actualizado',
    'Tu ticket #' || p_ticket_id || ' cambió a: ' || p_status || '.',
    'support_ticket', p_ticket_id, '/dashboard/soporte?ticket=' || p_ticket_id, false
  );
end;
$$;

create or replace function public.rate_support_ticket(
  p_ticket_id bigint,
  p_rating integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'La calificación debe estar entre 1 y 5.' using errcode='22023';
  end if;

  update public.support_tickets
  set satisfaction_rating = p_rating, updated_at = now()
  where id = p_ticket_id
    and user_id = auth.uid()
    and status in ('Resuelto','Cerrado');

  if not found then
    raise exception 'No puedes calificar este ticket.' using errcode='42501';
  end if;
end;
$$;

grant select, insert on public.support_tickets to authenticated;
grant select, insert on public.support_messages to authenticated;
grant usage, select on sequence public.support_tickets_id_seq to authenticated;
grant usage, select on sequence public.support_messages_id_seq to authenticated;
grant execute on function public.create_support_ticket(text,text,text,text) to authenticated;
grant execute on function public.add_support_message(bigint,text) to authenticated;
grant execute on function public.admin_update_support_ticket(bigint,text,text,uuid) to authenticated;
grant execute on function public.rate_support_ticket(bigint,integer) to authenticated;

notify pgrst, 'reload schema';
