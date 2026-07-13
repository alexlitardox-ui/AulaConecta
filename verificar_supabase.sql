-- AULACONECTA: VERIFICACIÓN FINAL (solo lectura)

select 'tabla' as tipo, required.name as objeto,
       case when c.oid is not null then 'OK' else 'FALTA' end as estado
from (values
 ('profiles'),('subjects'),('careers'),('semesters'),('tutor_requests'),
 ('tutor_applications'),('tutoring_sessions'),('study_groups'),('group_members'),
 ('reviews'),('materials'),('material_favorites'),('user_achievements'),('notifications'),
 ('conversations'),('conversation_members'),('messages')
) required(name)
left join pg_class c on c.relname=required.name and c.relnamespace='public'::regnamespace
order by required.name;

select 'funcion' as tipo, required.signature as objeto,
       case when to_regprocedure(required.signature) is not null then 'OK' else 'FALTA' end as estado
from (values
 ('public.accept_tutor_application(bigint)'),
 ('public.update_tutoring_status(bigint,text)'),
 ('public.join_study_group(bigint)'),
 ('public.review_group_membership(bigint,text)'),
 ('public.get_or_create_direct_conversation(uuid)'),
 ('public.register_material_download(bigint)'),
 ('public.current_user_is_admin()'),
 ('public.calculate_user_xp(uuid)'),
 ('public.get_my_gamification()'),
 ('public.get_gamification_leaderboard(integer)')
) required(signature)
order by required.signature;

select tablename, count(*) as politicas_rls
from pg_policies
where schemaname='public'
  and tablename in ('profiles','subjects','careers','semesters','tutor_requests','tutor_applications',
                    'tutoring_sessions','study_groups','group_members','reviews','materials',
                    'material_favorites','user_achievements','notifications','conversations',
                    'conversation_members','messages')
group by tablename
order by tablename;

select id as bucket, public
from storage.buckets
where id in ('avatars','materials')
order by id;

select tablename
from pg_publication_tables
where pubname='supabase_realtime' and schemaname='public'
  and tablename in ('messages','notifications')
order by tablename;

select 'catalogos_anon' as verificacion,
       case when count(*) = 3 then 'OK' else 'REVISAR' end as estado
from pg_policies
where schemaname='public'
  and tablename in ('subjects','careers','semesters')
  and 'anon' = any(roles);
