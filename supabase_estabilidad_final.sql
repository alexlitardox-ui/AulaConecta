-- ============================================================
-- AULACONECTA — INTEGRIDAD TOTAL DE SUPABASE
-- Ejecutar completo en Supabase > SQL Editor.
-- Es idempotente: puede ejecutarse nuevamente sin borrar datos.
-- Unifica perfiles, solicitudes, tutorías, grupos, materiales,
-- favoritos, reseñas, notificaciones, chat, storage y realtime.
-- ============================================================

begin;

-- Elimina políticas antiguas con nombres distintos para evitar permisos contradictorios.
do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in (
        'profiles','subjects','careers','semesters','tutor_requests','tutor_applications',
        'tutoring_sessions','study_groups','group_members','reviews','materials',
        'material_favorites','user_achievements','notifications','conversations','conversation_members','messages'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- Catálogos necesarios para formularios, perfiles y filtros.
alter table public.subjects enable row level security;
alter table public.careers enable row level security;
alter table public.semesters enable row level security;
create policy subjects_public_read on public.subjects for select to anon, authenticated using (true);
create policy careers_public_read on public.careers for select to anon, authenticated using (true);
create policy semesters_public_read on public.semesters for select to anon, authenticated using (true);
grant select on public.subjects, public.careers, public.semesters to anon, authenticated;

-- ------------------------------------------------------------
-- 1. PERFILES Y CREACIÓN AUTOMÁTICA DESDE AUTH
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

alter table public.profiles add column if not exists is_admin boolean not null default false;

drop policy if exists profiles_authenticated_read on public.profiles;
create policy profiles_authenticated_read on public.profiles
for select to authenticated using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_aulaconecta_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, career_id, semester_id, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(new.email, 'Estudiante'), '@', 1)),
    coalesce(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    case when (new.raw_user_meta_data ->> 'career_id') ~ '^[0-9]+$' then (new.raw_user_meta_data ->> 'career_id')::bigint else null end,
    case when (new.raw_user_meta_data ->> 'semester_id') ~ '^[0-9]+$' then (new.raw_user_meta_data ->> 'semester_id')::bigint else null end,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update set
    first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
    last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
    career_id = coalesce(public.profiles.career_id, excluded.career_id),
    semester_id = coalesce(public.profiles.semester_id, excluded.semester_id),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_aulaconecta on auth.users;
create trigger on_auth_user_created_aulaconecta
after insert or update of raw_user_meta_data on auth.users
for each row execute function public.handle_new_aulaconecta_user();

-- Recuperar perfiles faltantes de cuentas ya existentes.
insert into public.profiles (id, first_name, last_name, career_id, semester_id, avatar_url)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'first_name'), ''), split_part(coalesce(u.email, 'Estudiante'), '@', 1)),
  coalesce(trim(u.raw_user_meta_data ->> 'last_name'), ''),
  case when (u.raw_user_meta_data ->> 'career_id') ~ '^[0-9]+$' then (u.raw_user_meta_data ->> 'career_id')::bigint else null end,
  case when (u.raw_user_meta_data ->> 'semester_id') ~ '^[0-9]+$' then (u.raw_user_meta_data ->> 'semester_id')::bigint else null end,
  nullif(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. ADMINISTRACIÓN
-- ------------------------------------------------------------
create or replace function public.current_user_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false); $$;
grant execute on function public.current_user_is_admin() to authenticated;

-- ------------------------------------------------------------
-- 3. SOLICITUDES, POSTULACIONES Y TUTORÍAS
-- ------------------------------------------------------------
alter table public.tutor_requests enable row level security;
alter table public.tutor_applications enable row level security;
alter table public.tutoring_sessions enable row level security;

drop policy if exists tutor_requests_read on public.tutor_requests;
create policy tutor_requests_read on public.tutor_requests for select to authenticated using (true);
drop policy if exists tutor_requests_insert_own on public.tutor_requests;
create policy tutor_requests_insert_own on public.tutor_requests for insert to authenticated with check (student_id = auth.uid());
drop policy if exists tutor_requests_update_own on public.tutor_requests;
create policy tutor_requests_update_own on public.tutor_requests for update to authenticated using (student_id = auth.uid() or public.current_user_is_admin()) with check (student_id = auth.uid() or public.current_user_is_admin());

drop policy if exists tutor_applications_read_participants on public.tutor_applications;
create policy tutor_applications_read_participants on public.tutor_applications for select to authenticated using (
  tutor_id = auth.uid() or exists (
    select 1 from public.tutor_requests r where r.id = tutor_applications.request_id and r.student_id = auth.uid()
  ) or public.current_user_is_admin()
);
drop policy if exists tutor_applications_insert_own on public.tutor_applications;
create policy tutor_applications_insert_own on public.tutor_applications for insert to authenticated with check (
  tutor_id = auth.uid() and exists (
    select 1 from public.tutor_requests r where r.id = tutor_applications.request_id
      and r.student_id <> auth.uid() and r.status in ('open','with_applications')
  )
);

drop policy if exists tutoring_sessions_read_participants on public.tutoring_sessions;
create policy tutoring_sessions_read_participants on public.tutoring_sessions for select to authenticated using (student_id = auth.uid() or tutor_id = auth.uid() or public.current_user_is_admin());
drop policy if exists tutoring_sessions_update_participants on public.tutoring_sessions;
-- Los cambios de estado pasan por update_tutoring_status para validar rol y transición.

-- DROP obligatorio porque PostgreSQL no permite cambiar el retorno con CREATE OR REPLACE.
drop function if exists public.accept_tutor_application(bigint);
create function public.accept_tutor_application(target_application_id bigint)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  app public.tutor_applications%rowtype;
  req public.tutor_requests%rowtype;
  new_session_id bigint;
  has_request_id boolean;
  has_application_updated_at boolean;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;

  select * into app from public.tutor_applications where id = target_application_id for update;
  if not found then raise exception 'La postulación no existe.'; end if;

  select * into req from public.tutor_requests where id = app.request_id for update;
  if not found then raise exception 'La solicitud no existe.'; end if;
  if req.student_id <> auth.uid() then raise exception 'Solo el autor puede aceptar una postulación.' using errcode='42501'; end if;
  if req.status not in ('open','with_applications') then raise exception 'Esta solicitud ya fue procesada.'; end if;
  if app.status <> 'pending' then raise exception 'Esta postulación ya no está pendiente.'; end if;

  update public.tutor_applications
  set status = case when id = target_application_id then 'accepted' else 'rejected' end
  where request_id = req.id and status = 'pending';

  select exists(select 1 from information_schema.columns where table_schema='public' and table_name='tutor_applications' and column_name='updated_at') into has_application_updated_at;
  if has_application_updated_at then
    execute 'update public.tutor_applications set updated_at=now() where request_id=$1' using req.id;
  end if;

  update public.tutor_requests set status='accepted', updated_at=now() where id=req.id;

  select exists(select 1 from information_schema.columns where table_schema='public' and table_name='tutoring_sessions' and column_name='request_id') into has_request_id;
  if has_request_id then
    execute 'insert into public.tutoring_sessions (request_id,student_id,tutor_id,subject_id,session_date,start_time,end_time,modality,location_or_link,status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,''scheduled'') returning id'
      into new_session_id using req.id,req.student_id,app.tutor_id,req.subject_id,req.requested_date,req.start_time,req.end_time,req.modality,req.location_or_link;
  else
    insert into public.tutoring_sessions (student_id,tutor_id,subject_id,session_date,start_time,end_time,modality,location_or_link,status)
    values (req.student_id,app.tutor_id,req.subject_id,req.requested_date,req.start_time,req.end_time,req.modality,req.location_or_link,'scheduled')
    returning id into new_session_id;
  end if;

  return jsonb_build_object('request_id',req.id,'application_id',app.id,'session_id',new_session_id,'status','accepted');
end;
$$;
revoke all on function public.accept_tutor_application(bigint) from public;
grant execute on function public.accept_tutor_application(bigint) to authenticated;


-- Actualización segura del estado de una tutoría.
drop function if exists public.update_tutoring_status(bigint,text);
create function public.update_tutoring_status(target_session_id bigint, target_status text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := auth.uid();
  ses public.tutoring_sessions%rowtype;
begin
  if uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
  if target_status not in ('in_progress','completed','cancelled','not_completed') then
    raise exception 'Estado de tutoría no válido.';
  end if;

  select * into ses from public.tutoring_sessions where id=target_session_id for update;
  if not found then raise exception 'La tutoría no existe.'; end if;
  if uid not in (ses.student_id, ses.tutor_id) and not public.current_user_is_admin() then
    raise exception 'No tienes permiso para modificar esta tutoría.' using errcode='42501';
  end if;

  if target_status='in_progress' then
    if uid<>ses.tutor_id and not public.current_user_is_admin() then raise exception 'Solo el tutor puede iniciar la sesión.' using errcode='42501'; end if;
    if ses.status<>'scheduled' then raise exception 'Solo una tutoría programada puede iniciarse.'; end if;
  elsif target_status='completed' then
    if uid<>ses.tutor_id and not public.current_user_is_admin() then raise exception 'Solo el tutor puede completar la sesión.' using errcode='42501'; end if;
    if ses.status<>'in_progress' then raise exception 'Primero debes iniciar la tutoría.'; end if;
  elsif target_status='not_completed' then
    if uid<>ses.tutor_id and not public.current_user_is_admin() then raise exception 'Solo el tutor puede marcarla como no completada.' using errcode='42501'; end if;
    if ses.status not in ('scheduled','in_progress') then raise exception 'La tutoría ya fue cerrada.'; end if;
  elsif target_status='cancelled' then
    if ses.status not in ('scheduled','in_progress') then raise exception 'La tutoría ya no puede cancelarse.'; end if;
  end if;

  update public.tutoring_sessions
  set status=target_status, updated_at=now()
  where id=target_session_id;

  return jsonb_build_object('id',target_session_id,'status',target_status);
end;
$$;
revoke all on function public.update_tutoring_status(bigint,text) from public;
grant execute on function public.update_tutoring_status(bigint,text) to authenticated;

-- ------------------------------------------------------------
-- 4. GRUPOS Y MEMBRESÍAS
-- ------------------------------------------------------------
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;

create or replace function public.is_group_creator(target_group_id bigint)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.study_groups g where g.id=target_group_id and g.creator_id=auth.uid()); $$;
create or replace function public.is_group_member(target_group_id bigint)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.group_members gm where gm.group_id=target_group_id and gm.user_id=auth.uid() and gm.status='accepted'); $$;
grant execute on function public.is_group_creator(bigint) to authenticated;
grant execute on function public.is_group_member(bigint) to authenticated;

drop policy if exists study_groups_read on public.study_groups;
create policy study_groups_read on public.study_groups for select to authenticated using (true);
drop policy if exists study_groups_insert_own on public.study_groups;
create policy study_groups_insert_own on public.study_groups for insert to authenticated with check (creator_id=auth.uid());
drop policy if exists study_groups_update_creator on public.study_groups;
create policy study_groups_update_creator on public.study_groups for update to authenticated using (creator_id=auth.uid() or public.current_user_is_admin()) with check (creator_id=auth.uid() or public.current_user_is_admin());
drop policy if exists study_groups_delete_creator on public.study_groups;
create policy study_groups_delete_creator on public.study_groups for delete to authenticated using (creator_id=auth.uid() or public.current_user_is_admin());

drop policy if exists group_members_read on public.group_members;
create policy group_members_read on public.group_members for select to authenticated using (true);
drop policy if exists group_members_insert_own on public.group_members;
create policy group_members_insert_own on public.group_members for insert to authenticated with check (user_id=auth.uid() or public.is_group_creator(group_id));
drop policy if exists group_members_update_creator on public.group_members;
-- Un miembro no puede autoaceptar su propia solicitud.
create policy group_members_update_creator on public.group_members for update to authenticated
using (public.is_group_creator(group_id) or public.current_user_is_admin())
with check (public.is_group_creator(group_id) or public.current_user_is_admin());

drop function if exists public.join_study_group(bigint);
create function public.join_study_group(target_group_id bigint)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := auth.uid();
  grp public.study_groups%rowtype;
  accepted_count integer;
  membership_status text;
  membership_id bigint;
begin
  if uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
  select * into grp from public.study_groups where id=target_group_id for update;
  if not found then raise exception 'El grupo no existe.'; end if;
  if grp.creator_id=uid then raise exception 'Ya eres el creador de este grupo.'; end if;
  if grp.status not in ('active','full') then raise exception 'Este grupo ya no admite participantes.'; end if;

  select id,status into membership_id,membership_status from public.group_members where group_id=target_group_id and user_id=uid limit 1;
  if membership_id is not null then
    return jsonb_build_object('membership_id',membership_id,'status',membership_status,'already_exists',true);
  end if;

  select count(*) into accepted_count from public.group_members where group_id=target_group_id and status='accepted';
  if accepted_count >= grp.max_members then
    update public.study_groups set status='full' where id=target_group_id;
    raise exception 'El grupo ya no tiene cupos disponibles.';
  end if;

  membership_status := case when grp.access_type='public' then 'accepted' else 'pending' end;
  insert into public.group_members(group_id,user_id,member_role,status)
  values(target_group_id,uid,'member',membership_status) returning id into membership_id;

  if membership_status='accepted' and accepted_count+1 >= grp.max_members then
    update public.study_groups set status='full' where id=target_group_id;
  end if;

  return jsonb_build_object('membership_id',membership_id,'status',membership_status,'already_exists',false);
end;
$$;
revoke all on function public.join_study_group(bigint) from public;
grant execute on function public.join_study_group(bigint) to authenticated;


-- Aceptar o rechazar solicitudes de ingreso de manera segura.
drop function if exists public.review_group_membership(bigint,text);
create function public.review_group_membership(target_membership_id bigint, target_status text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  membership public.group_members%rowtype;
  grp public.study_groups%rowtype;
  accepted_count integer;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
  if target_status not in ('accepted','rejected') then raise exception 'Estado de membresía no válido.'; end if;

  select * into membership from public.group_members where id=target_membership_id for update;
  if not found then raise exception 'La solicitud de ingreso no existe.'; end if;
  if membership.status<>'pending' then raise exception 'La solicitud ya fue procesada.'; end if;

  select * into grp from public.study_groups where id=membership.group_id for update;
  if not found then raise exception 'El grupo no existe.'; end if;
  if grp.creator_id<>auth.uid() and not public.current_user_is_admin() then
    raise exception 'Solo el creador puede procesar solicitudes.' using errcode='42501';
  end if;

  if target_status='accepted' then
    select count(*) into accepted_count from public.group_members where group_id=grp.id and status='accepted';
    if accepted_count>=grp.max_members then
      update public.study_groups set status='full' where id=grp.id;
      raise exception 'El grupo ya no tiene cupos disponibles.';
    end if;
  end if;

  update public.group_members set status=target_status where id=target_membership_id;
  return jsonb_build_object('id',membership.id,'group_id',membership.group_id,'user_id',membership.user_id,'status',target_status);
end;
$$;
revoke all on function public.review_group_membership(bigint,text) from public;
grant execute on function public.review_group_membership(bigint,text) to authenticated;

-- ------------------------------------------------------------
-- 5. RESEÑAS Y REPUTACIÓN
-- ------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists reviews_authenticated_read on public.reviews;
create policy reviews_authenticated_read on public.reviews for select to authenticated using (true);
drop policy if exists reviews_participant_insert on public.reviews;
create policy reviews_participant_insert on public.reviews for insert to authenticated with check (
  reviewer_id=auth.uid() and reviewer_id<>reviewed_user_id and exists(
    select 1 from public.tutoring_sessions s where s.id=reviews.session_id and s.status='completed'
      and (s.student_id=auth.uid() or s.tutor_id=auth.uid())
      and reviewed_user_id = case when s.student_id=auth.uid() then s.tutor_id else s.student_id end
  )
);
create unique index if not exists reviews_session_reviewer_unique on public.reviews(session_id, reviewer_id);


-- ------------------------------------------------------------
-- 5B. GAMIFICACIÓN, XP, LOGROS Y RANKING
-- ------------------------------------------------------------
create table if not exists public.user_achievements (
  id bigint generated by default as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);
alter table public.user_achievements enable row level security;
drop policy if exists user_achievements_authenticated_read on public.user_achievements;
create policy user_achievements_authenticated_read on public.user_achievements
for select to authenticated using (true);
drop policy if exists user_achievements_insert_own on public.user_achievements;
create policy user_achievements_insert_own on public.user_achievements
for insert to authenticated with check (user_id = auth.uid());

create or replace function public.calculate_user_xp(target_user uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  select
    coalesce((select count(*) * 30 from public.tutoring_sessions where tutor_id = target_user and status = 'completed'), 0)::int +
    coalesce((select count(*) * 35 from public.materials where user_id = target_user and review_status = 'approved' and is_active = true), 0)::int +
    coalesce((select count(*) * 10 from public.study_groups where creator_id = target_user), 0)::int +
    coalesce((select count(*) * 25 from public.reviews where reviewed_user_id = target_user and rating = 5), 0)::int;
$$;

create or replace function public.get_my_gamification()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  xp integer;
  completed_tutoring integer;
  approved_materials integer;
  created_groups integer;
  five_star_reviews integer;
  review_count integer;
  average_rating numeric;
begin
  if uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
  select count(*) into completed_tutoring from public.tutoring_sessions where tutor_id = uid and status = 'completed';
  select count(*) into approved_materials from public.materials where user_id = uid and review_status = 'approved' and is_active = true;
  select count(*) into created_groups from public.study_groups where creator_id = uid;
  select count(*) into five_star_reviews from public.reviews where reviewed_user_id = uid and rating = 5;
  select count(*), coalesce(avg(rating), 0) into review_count, average_rating from public.reviews where reviewed_user_id = uid;
  xp := public.calculate_user_xp(uid);
  return jsonb_build_object(
    'xp', xp,
    'completed_tutoring', completed_tutoring,
    'approved_materials', approved_materials,
    'created_groups', created_groups,
    'five_star_reviews', five_star_reviews,
    'review_count', review_count,
    'average_rating', round(average_rating, 2)
  );
end;
$$;

create or replace function public.get_gamification_leaderboard(result_limit integer default 20)
returns table (user_id uuid, first_name text, last_name text, avatar_url text, xp integer)
language sql stable security definer set search_path = public
as $$
  select p.id, p.first_name, p.last_name, p.avatar_url, public.calculate_user_xp(p.id) as xp
  from public.profiles p
  order by xp desc, p.first_name asc
  limit greatest(1, least(result_limit, 100));
$$;

revoke all on function public.calculate_user_xp(uuid) from public;
revoke all on function public.get_my_gamification() from public;
revoke all on function public.get_gamification_leaderboard(integer) from public;
grant execute on function public.calculate_user_xp(uuid) to authenticated;
grant execute on function public.get_my_gamification() to authenticated;
grant execute on function public.get_gamification_leaderboard(integer) to authenticated;

-- ------------------------------------------------------------
-- 6. MATERIALES, FAVORITOS Y STORAGE
-- ------------------------------------------------------------
alter table public.materials enable row level security;

drop policy if exists materials_read_approved_or_own on public.materials;
create policy materials_read_approved_or_own on public.materials for select to authenticated using ((is_active=true and review_status='approved') or user_id=auth.uid() or public.current_user_is_admin());
drop policy if exists materials_insert_own on public.materials;
create policy materials_insert_own on public.materials for insert to authenticated with check (user_id=auth.uid());
drop policy if exists materials_update_own_admin on public.materials;
create policy materials_update_own_admin on public.materials for update to authenticated using (user_id=auth.uid() or public.current_user_is_admin()) with check (user_id=auth.uid() or public.current_user_is_admin());
drop policy if exists materials_delete_own_admin on public.materials;
create policy materials_delete_own_admin on public.materials for delete to authenticated using (user_id=auth.uid() or public.current_user_is_admin());

create table if not exists public.material_favorites(
  id bigint generated by default as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id bigint not null references public.materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id,material_id)
);
alter table public.material_favorites enable row level security;
drop policy if exists material_favorites_own_read on public.material_favorites;
create policy material_favorites_own_read on public.material_favorites for select to authenticated using(user_id=auth.uid());
drop policy if exists material_favorites_own_insert on public.material_favorites;
create policy material_favorites_own_insert on public.material_favorites for insert to authenticated with check(user_id=auth.uid());
drop policy if exists material_favorites_own_delete on public.material_favorites;
create policy material_favorites_own_delete on public.material_favorites for delete to authenticated using(user_id=auth.uid());

insert into storage.buckets(id,name,public) values('avatars','avatars',true) on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values('materials','materials',false) on conflict(id) do update set public=false;

drop policy if exists avatars_authenticated_upload on storage.objects;
create policy avatars_authenticated_upload on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists materials_owner_read on storage.objects;
create policy materials_owner_read on storage.objects for select to authenticated using(bucket_id='materials');
drop policy if exists materials_owner_upload on storage.objects;
create policy materials_owner_upload on storage.objects for insert to authenticated with check(bucket_id='materials' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists materials_owner_delete on storage.objects;
create policy materials_owner_delete on storage.objects for delete to authenticated using(bucket_id='materials' and (storage.foldername(name))[1]=auth.uid()::text);

-- ------------------------------------------------------------
-- 7. NOTIFICACIONES
-- ------------------------------------------------------------
alter table public.notifications enable row level security;

-- Sustituye listas antiguas de tipos por una validación extensible.
update public.notifications set notification_type='general' where notification_type is null or trim(notification_type)='';
alter table public.notifications drop constraint if exists notifications_notification_type_check;
alter table public.notifications add constraint notifications_notification_type_check
check (notification_type is not null and length(trim(notification_type)) between 1 and 80);
drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists notifications_own_delete on public.notifications;
create policy notifications_own_delete on public.notifications for delete to authenticated using(user_id=auth.uid());

-- ------------------------------------------------------------
-- 8. CHAT DIRECTO
-- ------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(target_conversation_id bigint)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.conversation_members cm where cm.conversation_id=target_conversation_id and cm.user_id=auth.uid()); $$;
grant execute on function public.is_conversation_member(bigint) to authenticated;

drop function if exists public.get_or_create_direct_conversation(uuid);
create function public.get_or_create_direct_conversation(target_user_id uuid)
returns bigint language plpgsql security definer set search_path=public
as $$
declare uid uuid:=auth.uid(); cid bigint;
begin
  if uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
  if target_user_id is null or target_user_id=uid then raise exception 'Selecciona otro usuario.'; end if;
  if not exists(select 1 from public.profiles where id=target_user_id) then raise exception 'El usuario no existe.'; end if;

  -- Evita conversaciones duplicadas si ambos usuarios abren el chat al mismo tiempo.
  perform pg_advisory_xact_lock(hashtextextended(least(uid::text,target_user_id::text)||':'||greatest(uid::text,target_user_id::text),0));

  select c.id into cid from public.conversations c
  where public.is_conversation_member(c.id)
    and exists(select 1 from public.conversation_members cm where cm.conversation_id=c.id and cm.user_id=target_user_id)
    and (select count(*) from public.conversation_members cm2 where cm2.conversation_id=c.id)=2
  order by c.created_at desc limit 1;
  if cid is not null then return cid; end if;

  insert into public.conversations default values returning id into cid;
  insert into public.conversation_members(conversation_id,user_id) values(cid,uid),(cid,target_user_id);
  return cid;
end;
$$;
revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

drop policy if exists conversations_members_read on public.conversations;
create policy conversations_members_read on public.conversations for select to authenticated using(public.is_conversation_member(id));
drop policy if exists conversation_members_members_read on public.conversation_members;
create policy conversation_members_members_read on public.conversation_members for select to authenticated using(public.is_conversation_member(conversation_id));
drop policy if exists messages_members_read on public.messages;
create policy messages_members_read on public.messages for select to authenticated using(public.is_conversation_member(conversation_id));
drop policy if exists messages_members_insert on public.messages;
create policy messages_members_insert on public.messages for insert to authenticated with check(sender_id=auth.uid() and public.is_conversation_member(conversation_id));

-- ------------------------------------------------------------
-- 9. PERMISOS Y REALTIME
-- ------------------------------------------------------------
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.profiles,public.tutor_requests,public.tutor_applications,public.tutoring_sessions,public.study_groups,public.group_members,public.reviews,public.materials,public.material_favorites,public.user_achievements,public.notifications,public.conversations,public.conversation_members,public.messages to authenticated;
grant usage,select on all sequences in schema public to authenticated;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then alter publication supabase_realtime add table public.messages; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then alter publication supabase_realtime add table public.notifications; end if;
end $$;


-- ------------------------------------------------------------
-- 10. AUTOMATIZACIONES DE CONSISTENCIA
-- ------------------------------------------------------------

-- Una postulación cambia automáticamente la solicitud a with_applications.
create or replace function public.after_tutor_application_insert()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  update public.tutor_requests
  set status = case when status='open' then 'with_applications' else status end,
      updated_at = now()
  where id=new.request_id;

  insert into public.notifications(user_id,notification_type,title,message,related_entity_type,related_entity_id,action_url,is_read)
  select r.student_id,'tutor_application','Nueva postulación','Un estudiante se postuló para ayudarte.','tutor_request',r.id,'/dashboard/solicitudes/'||r.id,false
  from public.tutor_requests r where r.id=new.request_id;
  return new;
end;
$$;
drop trigger if exists tutor_application_insert_aulaconecta on public.tutor_applications;
create trigger tutor_application_insert_aulaconecta after insert on public.tutor_applications
for each row execute function public.after_tutor_application_insert();

-- Avisar al tutor cuando su postulación cambia a aceptada o rechazada.
create or replace function public.after_tutor_application_status_change()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if old.status is distinct from new.status and new.status in ('accepted','rejected') then
    insert into public.notifications(user_id,notification_type,title,message,related_entity_type,related_entity_id,action_url,is_read)
    values(new.tutor_id,'tutor_application_'||new.status,
      case when new.status='accepted' then 'Postulación aceptada' else 'Postulación no seleccionada' end,
      case when new.status='accepted' then 'Tu tutoría ya fue programada.' else 'La solicitud fue asignada a otro tutor.' end,
      'tutor_application',new.id,
      case when new.status='accepted' then '/dashboard/tutorias' else '/dashboard/solicitudes' end,false);
  end if;
  return new;
end;
$$;
drop trigger if exists tutor_application_status_aulaconecta on public.tutor_applications;
create trigger tutor_application_status_aulaconecta after update of status on public.tutor_applications
for each row execute function public.after_tutor_application_status_change();

-- Recalcular reputación y tutorías completadas sin depender del frontend.
create or replace function public.refresh_profile_reputation(target_user uuid)
returns void language plpgsql security definer set search_path=public
as $$
begin
  update public.profiles p set rating=coalesce((select avg(r.rating) from public.reviews r where r.reviewed_user_id=target_user),0)
  where p.id=target_user;
end;
$$;
create or replace function public.after_review_change()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_profile_reputation(old.reviewed_user_id);
    return old;
  else
    perform public.refresh_profile_reputation(new.reviewed_user_id);
    return new;
  end if;
end;
$$;
drop trigger if exists reviews_reputation_aulaconecta on public.reviews;
create trigger reviews_reputation_aulaconecta after insert or update or delete on public.reviews
for each row execute function public.after_review_change();

create or replace function public.after_tutoring_status_change()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if old.status is distinct from new.status then
    update public.profiles p set completed_tutoring=(select count(*) from public.tutoring_sessions s where s.tutor_id=new.tutor_id and s.status='completed') where p.id=new.tutor_id;
    if new.status='completed' then
      insert into public.notifications(user_id,notification_type,title,message,related_entity_type,related_entity_id,action_url,is_read)
      values
        (new.student_id,'tutoring_completed','Tutoría completada','Ya puedes calificar la sesión.','tutoring_session',new.id,'/dashboard/tutorias',false),
        (new.tutor_id,'tutoring_completed','Tutoría completada','La sesión fue marcada como completada.','tutoring_session',new.id,'/dashboard/tutorias',false);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists tutoring_status_aulaconecta on public.tutoring_sessions;
create trigger tutoring_status_aulaconecta after update of status on public.tutoring_sessions
for each row execute function public.after_tutoring_status_change();

-- Mantener estado active/full de los grupos según cupos aceptados.
create or replace function public.sync_study_group_capacity()
returns trigger language plpgsql security definer set search_path=public
as $$
declare gid bigint; accepted_count integer; capacity integer;
begin
  gid := case when tg_op='DELETE' then old.group_id else new.group_id end;
  select count(*) into accepted_count from public.group_members where group_id=gid and status='accepted';
  select max_members into capacity from public.study_groups where id=gid;
  if capacity is not null then
    update public.study_groups set status=case when accepted_count>=capacity then 'full' else 'active' end where id=gid and status in ('active','full');
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists group_capacity_aulaconecta on public.group_members;
create trigger group_capacity_aulaconecta after insert or update or delete on public.group_members
for each row execute function public.sync_study_group_capacity();

-- Conteo de descargas seguro y atómico.
drop function if exists public.register_material_download(bigint);
create function public.register_material_download(target_material_id bigint)
returns integer language plpgsql security definer set search_path=public
as $$
declare new_count integer;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
  update public.materials set download_count=coalesce(download_count,0)+1
  where id=target_material_id and is_active=true and review_status='approved'
  returning download_count into new_count;
  if new_count is null then raise exception 'El material no está disponible.'; end if;
  return new_count;
end;
$$;
revoke all on function public.register_material_download(bigint) from public;
grant execute on function public.register_material_download(bigint) to authenticated;

-- Avisar al autor cuando un administrador modera su material.
create or replace function public.after_material_review_change()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if old.review_status is distinct from new.review_status and new.review_status in ('approved','rejected') then
    insert into public.notifications(user_id,notification_type,title,message,related_entity_type,related_entity_id,action_url,is_read)
    values(new.user_id,'material_'||new.review_status,
      case when new.review_status='approved' then 'Material aprobado' else 'Material rechazado' end,
      case when new.review_status='approved' then 'Tu material ya está disponible en la biblioteca.' else 'Tu material no superó la revisión.' end,
      'material',new.id,'/dashboard/materiales/mios',false);
  end if;
  return new;
end;
$$;
drop trigger if exists material_review_aulaconecta on public.materials;
create trigger material_review_aulaconecta after update of review_status on public.materials
for each row execute function public.after_material_review_change();


-- Índices usados por listados y validaciones frecuentes.
create index if not exists tutor_requests_student_status_idx on public.tutor_requests(student_id,status);
create index if not exists tutor_applications_request_status_idx on public.tutor_applications(request_id,status);
create index if not exists tutor_applications_tutor_idx on public.tutor_applications(tutor_id);
create index if not exists tutoring_sessions_participants_idx on public.tutoring_sessions(student_id,tutor_id,session_date);
create index if not exists group_members_group_status_idx on public.group_members(group_id,status);
create index if not exists group_members_user_status_idx on public.group_members(user_id,status);
create index if not exists materials_review_active_idx on public.materials(review_status,is_active,created_at desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id,is_read,created_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id,conversation_id);

commit;

-- Para convertir una cuenta en administradora, cambia el correo y ejecuta aparte:
-- update public.profiles p set is_admin=true from auth.users u where p.id=u.id and u.email='TU_CORREO@EJEMPLO.COM';
