-- Verificación de roles, auditoría y funciones administrativas.
select column_name,
       case when column_name is not null then 'OK' else 'FALTA' end as estado
from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name in ('role','is_admin');

select 'audit_logs' as objeto,
       case when to_regclass('public.audit_logs') is not null then 'OK' else 'FALTA' end as estado;

select signature as funcion,
       case when to_regprocedure(signature) is not null then 'OK' else 'FALTA' end as estado
from (values
 ('public.current_user_role()'),
 ('public.current_user_is_admin()'),
 ('public.current_user_can_moderate()'),
 ('public.admin_set_user_role(uuid,text)'),
 ('public.admin_delete_request(bigint,text)'),
 ('public.admin_delete_group(bigint,text)'),
 ('public.admin_delete_material(bigint,text)'),
 ('public.admin_cancel_session(bigint,text)')
) x(signature)
order by signature;
