-- AULACONECTA: VERIFICACIÓN DEL PANEL DE CIBERSEGURIDAD

select 'security_scan_logs' as objeto,
       case when to_regclass('public.security_scan_logs') is not null
            then 'OK' else 'FALTA' end as estado;

select 'admin_security_overview()' as objeto,
       case when to_regprocedure('public.admin_security_overview()') is not null
            then 'OK' else 'FALTA' end as estado;

select 'admin_record_security_scan(integer,jsonb)' as objeto,
       case when to_regprocedure('public.admin_record_security_scan(integer,jsonb)') is not null
            then 'OK' else 'FALTA' end as estado;

select c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'security_scan_logs';
