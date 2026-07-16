-- AULACONECTA ENTERPRISE - ELIMINACION SEGURA DE CONTENIDO PROPIO

create or replace function public.delete_own_tutor_request(target_request_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  select status into current_status
  from public.tutor_requests
  where id = target_request_id and student_id = auth.uid()
  for update;

  if not found then
    raise exception 'La solicitud no existe o no te pertenece.' using errcode = '42501';
  end if;

  if current_status = 'accepted' then
    raise exception 'No se puede eliminar una solicitud aceptada porque tiene una tutoría asociada.' using errcode = 'P0001';
  end if;

  delete from public.tutor_applications where request_id = target_request_id;
  delete from public.tutor_requests where id = target_request_id and student_id = auth.uid();

  if to_regprocedure('public.write_audit_log(text,text,text,text,jsonb)') is not null then
    perform public.write_audit_log('owner_deleted','tutor_request',target_request_id::text,'Eliminación realizada por el propietario',null);
  end if;

  return true;
end;
$$;

create or replace function public.delete_own_study_group(target_group_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.study_groups
    where id = target_group_id and creator_id = auth.uid()
  ) then
    raise exception 'El grupo no existe o no te pertenece.' using errcode = '42501';
  end if;

  delete from public.group_members where group_id = target_group_id;
  delete from public.study_groups where id = target_group_id and creator_id = auth.uid();

  if to_regprocedure('public.write_audit_log(text,text,text,text,jsonb)') is not null then
    perform public.write_audit_log('owner_deleted','study_group',target_group_id::text,'Eliminación realizada por el propietario',null);
  end if;

  return true;
end;
$$;

grant execute on function public.delete_own_tutor_request(bigint) to authenticated;
grant execute on function public.delete_own_study_group(bigint) to authenticated;
