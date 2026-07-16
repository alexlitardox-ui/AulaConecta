select 'profiles_account_status' as objeto,
       case when exists (
         select 1 from information_schema.columns
         where table_schema='public' and table_name='profiles' and column_name='account_status'
       ) then 'OK' else 'FALTA' end as estado;

select 'admin_set_user_status(uuid,text,text)' as objeto,
       case when to_regprocedure('public.admin_set_user_status(uuid,text,text)') is not null
            then 'OK' else 'FALTA' end as estado;

select 'current_user_is_active()' as objeto,
       case when to_regprocedure('public.current_user_is_active()') is not null
            then 'OK' else 'FALTA' end as estado;

select event_object_table as tabla, trigger_name
from information_schema.triggers
where trigger_schema='public'
  and trigger_name='enforce_active_account_trigger'
order by event_object_table;
