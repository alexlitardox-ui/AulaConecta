-- AulaConecta: corrección integral de perfiles públicos y solicitudes de tutoría
-- Ejecutar una sola vez en Supabase > SQL Editor.

begin;

-- Los usuarios autenticados necesitan leer perfiles para búsquedas,
-- tarjetas, postulaciones, chat y perfiles públicos internos.
alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'authenticated_users_can_read_profiles'
  ) then
    create policy authenticated_users_can_read_profiles
      on public.profiles
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Solicitudes: todos los usuarios autenticados pueden verlas;
-- cada estudiante crea y modifica únicamente las suyas.
alter table public.tutor_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tutor_requests'
      and policyname = 'authenticated_users_can_read_tutor_requests'
  ) then
    create policy authenticated_users_can_read_tutor_requests
      on public.tutor_requests for select to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tutor_requests'
      and policyname = 'students_can_create_own_tutor_requests'
  ) then
    create policy students_can_create_own_tutor_requests
      on public.tutor_requests for insert to authenticated
      with check (student_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tutor_requests'
      and policyname = 'students_can_update_own_tutor_requests'
  ) then
    create policy students_can_update_own_tutor_requests
      on public.tutor_requests for update to authenticated
      using (student_id = auth.uid())
      with check (student_id = auth.uid());
  end if;
end $$;

-- Postulaciones: el postulante y el autor de la solicitud pueden leerlas.
-- Un estudiante puede postularse solo como sí mismo y no a su propia solicitud.
alter table public.tutor_applications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tutor_applications'
      and policyname = 'participants_can_read_tutor_applications'
  ) then
    create policy participants_can_read_tutor_applications
      on public.tutor_applications for select to authenticated
      using (
        tutor_id = auth.uid()
        or exists (
          select 1
          from public.tutor_requests request
          where request.id = tutor_applications.request_id
            and request.student_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tutor_applications'
      and policyname = 'users_can_create_own_tutor_applications'
  ) then
    create policy users_can_create_own_tutor_applications
      on public.tutor_applications for insert to authenticated
      with check (
        tutor_id = auth.uid()
        and exists (
          select 1
          from public.tutor_requests request
          where request.id = tutor_applications.request_id
            and request.student_id <> auth.uid()
            and request.status in ('open', 'with_applications')
        )
      );
  end if;
end $$;

-- Las sesiones solo son visibles para el estudiante o tutor involucrado.
alter table public.tutoring_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tutoring_sessions'
      and policyname = 'participants_can_read_tutoring_sessions'
  ) then
    create policy participants_can_read_tutoring_sessions
      on public.tutoring_sessions for select to authenticated
      using (student_id = auth.uid() or tutor_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tutoring_sessions'
      and policyname = 'participants_can_update_tutoring_sessions'
  ) then
    create policy participants_can_update_tutoring_sessions
      on public.tutoring_sessions for update to authenticated
      using (student_id = auth.uid() or tutor_id = auth.uid())
      with check (student_id = auth.uid() or tutor_id = auth.uid());
  end if;
end $$;

-- Acepta una postulación de forma atómica y crea la tutoría.
create or replace function public.accept_tutor_application(target_application_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_application public.tutor_applications%rowtype;
  selected_request public.tutor_requests%rowtype;
  created_session_id bigint;
  has_request_id boolean;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;

  select * into selected_application
  from public.tutor_applications
  where id = target_application_id
  for update;

  if not found then
    raise exception 'La postulación no existe.';
  end if;

  select * into selected_request
  from public.tutor_requests
  where id = selected_application.request_id
  for update;

  if not found then
    raise exception 'La solicitud no existe.';
  end if;

  if selected_request.student_id <> auth.uid() then
    raise exception 'Solo el autor puede aceptar una postulación.' using errcode = '42501';
  end if;

  if selected_request.status not in ('open', 'with_applications') then
    raise exception 'Esta solicitud ya fue procesada.';
  end if;

  if selected_application.status <> 'pending' then
    raise exception 'Esta postulación ya no está pendiente.';
  end if;

  update public.tutor_applications
  set status = case when id = target_application_id then 'accepted' else 'rejected' end,
      updated_at = now()
  where request_id = selected_request.id
    and status = 'pending';

  update public.tutor_requests
  set status = 'accepted', updated_at = now()
  where id = selected_request.id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tutoring_sessions'
      and column_name = 'request_id'
  ) into has_request_id;

  if has_request_id then
    execute $insert$
      insert into public.tutoring_sessions (
        request_id, student_id, tutor_id, subject_id, session_date,
        start_time, end_time, modality, location_or_link, status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'scheduled')
      returning id
    $insert$
    into created_session_id
    using selected_request.id, selected_request.student_id,
      selected_application.tutor_id, selected_request.subject_id,
      selected_request.requested_date, selected_request.start_time,
      selected_request.end_time, selected_request.modality,
      selected_request.location_or_link;
  else
    insert into public.tutoring_sessions (
      student_id, tutor_id, subject_id, session_date,
      start_time, end_time, modality, location_or_link, status
    ) values (
      selected_request.student_id, selected_application.tutor_id,
      selected_request.subject_id, selected_request.requested_date,
      selected_request.start_time, selected_request.end_time,
      selected_request.modality, selected_request.location_or_link,
      'scheduled'
    ) returning id into created_session_id;
  end if;

  return jsonb_build_object(
    'request_id', selected_request.id,
    'application_id', selected_application.id,
    'session_id', created_session_id,
    'status', 'accepted'
  );
end;
$$;

revoke all on function public.accept_tutor_application(bigint) from public;
grant execute on function public.accept_tutor_application(bigint) to authenticated;

commit;
