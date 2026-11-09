alter table public.kyro_calendar_connections add column if not exists auto_sync boolean not null default false;
alter table public.notes add column if not exists tags text[] default '{}';
create or replace function public.kyro_task_updated_at() returns trigger language plpgsql set search_path='' as $$
begin
 if (to_jsonb(new)-array['updated_at','google_event_id','google_etag','google_synced_at','google_sync_error','google_conflict']) is distinct from (to_jsonb(old)-array['updated_at','google_event_id','google_etag','google_synced_at','google_sync_error','google_conflict']) then new.updated_at=now(); else new.updated_at=old.updated_at; end if;
 return new;
end; $$;
create or replace function public.kyro_save_calendar_sync(p_task_id integer,p_patch jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 if p_patch ? 'due' then
  update public.tasks set title=p_patch->>'title',due=(p_patch->>'due')::timestamptz,comments=p_patch->>'comments',duration_minutes=(p_patch->>'duration_minutes')::integer,google_etag=p_patch->>'google_etag',google_synced_at=now(),google_sync_error=null where id=p_task_id and user_id=auth.uid();
 else
  update public.tasks set google_event_id=case when p_patch?'google_event_id' then p_patch->>'google_event_id' else google_event_id end,
   google_etag=case when p_patch?'google_etag' then p_patch->>'google_etag' else google_etag end,
   google_synced_at=case when p_patch?'google_synced_at' then now() else google_synced_at end,
   google_sync_error=case when p_patch?'google_sync_error' then p_patch->>'google_sync_error' else google_sync_error end,
   google_conflict=case when p_patch?'google_conflict' then p_patch->'google_conflict' else google_conflict end
   where id=p_task_id and user_id=auth.uid();
 end if;
 if not found then raise exception 'Actividad no disponible'; end if;
end $$;
revoke all on function public.kyro_save_calendar_sync(integer,jsonb) from public,anon;
grant execute on function public.kyro_save_calendar_sync(integer,jsonb) to authenticated;
