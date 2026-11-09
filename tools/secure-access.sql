-- Apply only when the authenticated application is ready. No data mutations.
drop policy if exists "Permitir todo a todos" on public.leads;
drop policy if exists kyro_shared_sales_insert on public.deals;
drop policy if exists kyro_shared_sales_select on public.deals;
drop policy if exists kyro_shared_sales_update on public.deals;
drop policy if exists contact_days_shared on public.kyro_contact_days;
drop policy if exists "public read clients" on public.clients;
drop policy if exists "public read todos" on public.todos;
alter table public.quotations enable row level security;
alter table public.quotation_templates enable row level security;
-- Existing owner policies continue to govern authenticated access.
revoke all on function public.get_decrypted_secrets() from public,anon,authenticated;
alter function public.handle_new_user() set search_path='';
alter function public.handle_user_profile_update() set search_path='';
alter function public.get_decrypted_secrets() set search_path='';
