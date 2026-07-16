select 'reports_table' objeto,case when to_regclass('public.reports') is not null then 'OK' else 'FALTA' end estado
union all select 'admin_resolve_report',case when to_regprocedure('public.admin_resolve_report(bigint,text,text)') is not null then 'OK' else 'FALTA' end;
