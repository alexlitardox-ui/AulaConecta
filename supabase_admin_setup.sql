-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.

alter table public.profiles
add column if not exists is_admin boolean not null default false;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.current_user_is_admin() to authenticated;

-- Lectura global para administradores.
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles for select to authenticated using (public.current_user_is_admin());

drop policy if exists "Admins can read all tutor requests" on public.tutor_requests;
create policy "Admins can read all tutor requests" on public.tutor_requests for select to authenticated using (public.current_user_is_admin());

drop policy if exists "Admins can read all tutoring sessions" on public.tutoring_sessions;
create policy "Admins can read all tutoring sessions" on public.tutoring_sessions for select to authenticated using (public.current_user_is_admin());

drop policy if exists "Admins can read all study groups" on public.study_groups;
create policy "Admins can read all study groups" on public.study_groups for select to authenticated using (public.current_user_is_admin());

drop policy if exists "Admins can read all materials" on public.materials;
create policy "Admins can read all materials" on public.materials for select to authenticated using (public.current_user_is_admin());

drop policy if exists "Admins can moderate materials" on public.materials;
create policy "Admins can moderate materials" on public.materials for update to authenticated using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- Convierte tu cuenta en administradora. Cambia el correo antes de ejecutar esta línea.
-- update public.profiles p set is_admin = true from auth.users u where p.id = u.id and u.email = 'TU_CORREO@EJEMPLO.COM';
