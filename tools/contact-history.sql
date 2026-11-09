-- Daily outreach is separate from conversations and commercial status.
CREATE TABLE public.kyro_contact_days (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_key text NOT NULL CHECK (record_key ~ '^(lead|sale):[0-9]+$'),
  contact_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Mexico_City')::date,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, record_key, contact_date)
);
ALTER TABLE public.kyro_contact_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kyro_contact_days FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.kyro_contact_days TO anon, authenticated;
CREATE POLICY contact_days_owner ON public.kyro_contact_days FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
-- Match KYRO's existing shared workspace access; no access to other owners.
CREATE POLICY contact_days_shared ON public.kyro_contact_days FOR ALL TO anon
  USING (user_id = '882f8e4e-9124-4334-849b-44c25ca2aed3'::uuid)
  WITH CHECK (user_id = '882f8e4e-9124-4334-849b-44c25ca2aed3'::uuid);
CREATE VIEW public.kyro_last_contacts WITH (security_invoker = true) AS
  SELECT user_id, record_key, max(contact_date) AS last_contact_date
  FROM public.kyro_contact_days GROUP BY user_id, record_key;
REVOKE ALL ON public.kyro_last_contacts FROM PUBLIC;
GRANT SELECT ON public.kyro_last_contacts TO anon, authenticated;
CREATE FUNCTION public.kyro_mark_contact(p_user_id uuid, p_record_key text, p_checked boolean)
RETURNS TABLE (last_contact_date date, business_day date)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE today date := (now() AT TIME ZONE 'America/Mexico_City')::date;
BEGIN
  -- Serialize toggles for the same card across browser tabs.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_record_key, 0));
  IF p_checked THEN
    INSERT INTO public.kyro_contact_days(user_id, record_key, contact_date)
      VALUES (p_user_id, p_record_key, today) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.kyro_contact_days
      WHERE user_id = p_user_id AND record_key = p_record_key AND contact_date = today;
  END IF;
  RETURN QUERY SELECT max(c.contact_date), today FROM public.kyro_contact_days c
    WHERE c.user_id = p_user_id AND c.record_key = p_record_key;
END;
$$;
REVOKE ALL ON FUNCTION public.kyro_mark_contact(uuid,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kyro_mark_contact(uuid,text,boolean) TO anon,authenticated;
