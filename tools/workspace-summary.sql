CREATE OR REPLACE VIEW public.kyro_leads_summary WITH (security_invoker = true) AS
SELECT l.id,l.user_id,l.name,l.contact,l.email,l.phone,l.status,l.score,l.source,l.machines,
l.last_activity,l.created_at,l.notes,
CASE WHEN jsonb_typeof(l.quotations) = 'array' THEN
  (SELECT coalesce(jsonb_agg(
    CASE WHEN q.item->>'url' LIKE 'data:%' THEN (q.item - 'url') || '{"deferred":true}'::jsonb ELSE q.item END
    ORDER BY q.ordinality), '[]'::jsonb)
   FROM jsonb_array_elements(l.quotations) WITH ORDINALITY AS q(item,ordinality))
ELSE l.quotations END AS quotations,
l.follow_up_date,l.activity_status,l.next_step,l.position,l.dynamic_quotation_url
FROM public.leads l;
REVOKE ALL ON public.kyro_leads_summary FROM PUBLIC;
GRANT SELECT ON public.kyro_leads_summary TO anon,authenticated;
COMMENT ON VIEW public.kyro_leads_summary IS 'Read-only dashboard projection. Embedded quotation files load from leads on demand. Underlying row security remains enforced.';
