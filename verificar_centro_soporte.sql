select 'support_tickets' as objeto,
  case when to_regclass('public.support_tickets') is not null then 'OK' else 'FALTA' end as estado
union all
select 'support_messages',
  case when to_regclass('public.support_messages') is not null then 'OK' else 'FALTA' end
union all
select 'create_support_ticket',
  case when to_regprocedure('public.create_support_ticket(text,text,text,text)') is not null then 'OK' else 'FALTA' end
union all
select 'add_support_message',
  case when to_regprocedure('public.add_support_message(bigint,text)') is not null then 'OK' else 'FALTA' end
union all
select 'admin_update_support_ticket',
  case when to_regprocedure('public.admin_update_support_ticket(bigint,text,text,uuid)') is not null then 'OK' else 'FALTA' end
union all
select 'rate_support_ticket',
  case when to_regprocedure('public.rate_support_ticket(bigint,integer)') is not null then 'OK' else 'FALTA' end;

select relname as tabla, relrowsecurity as rls_activo
from pg_class
where oid in ('public.support_tickets'::regclass, 'public.support_messages'::regclass);
