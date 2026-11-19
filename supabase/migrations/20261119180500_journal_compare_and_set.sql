-- Preserve concurrent changes to legacy histories during edits and AI chat sync.
create or replace function public.kyro_replace_journal_legacy(
  p_kind text, p_id integer, p_expected text, p_next text
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_kind = 'lead' then
    update public.leads set notes = p_next, last_activity = now()
    where id = p_id and user_id = auth.uid() and notes is not distinct from p_expected;
  elsif p_kind = 'sale' then
    update public.deals set closing_status = jsonb_set(closing_status, '{source_lead,notes}', to_jsonb(p_next))
    where id = p_id and user_id = auth.uid() and closing_status ? 'source_lead'
    and closing_status #>> '{source_lead,notes}' is not distinct from p_expected;
  else
    return false;
  end if;
  return found;
end;
$$;
revoke all on function public.kyro_replace_journal_legacy(text, integer, text, text) from public, anon;
grant execute on function public.kyro_replace_journal_legacy(text, integer, text, text) to authenticated;
