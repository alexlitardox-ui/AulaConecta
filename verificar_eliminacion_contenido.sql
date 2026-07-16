select 'delete_own_tutor_request' as objeto, case when to_regprocedure('public.delete_own_tutor_request(bigint)') is not null then 'OK' else 'FALTA' end as estado
union all
select 'delete_own_study_group', case when to_regprocedure('public.delete_own_study_group(bigint)') is not null then 'OK' else 'FALTA' end;
