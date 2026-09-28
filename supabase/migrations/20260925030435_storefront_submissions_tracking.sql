-- Private durable inbox + newsletter consent. These endpoints report success only after commit.
create table if not exists public.contact_messages (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null,
 message text not null, created_at timestamptz not null default now()
);
create table if not exists public.newsletter_subscribers (
 email text primary key, consent_at timestamptz not null default now(),
 source text not null default 'storefront', unsubscribed_at timestamptz
);
create table if not exists public.storefront_submission_limits (
 key text primary key, count integer not null default 1, reset_at timestamptz not null
);
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.storefront_submission_limits enable row level security;
revoke all on public.contact_messages, public.newsletter_subscribers, public.storefront_submission_limits from anon, authenticated;
grant all on public.contact_messages, public.newsletter_subscribers, public.storefront_submission_limits to service_role;

create or replace function public.submit_storefront_form(p_kind text, p_payload jsonb, p_rate_key text)
returns text language plpgsql security invoker set search_path = public as $$
declare v_count integer;
begin
 if p_kind not in ('contact', 'newsletter') or length(p_rate_key) <> 64 then raise exception 'invalid submission'; end if;
 if coalesce(length(p_payload->>'email'), 0) not between 3 and 254 then raise exception 'invalid email'; end if;
 if p_kind = 'newsletter' and (p_payload->>'consent') is distinct from 'true' then raise exception 'consent required'; end if;
 if p_kind = 'contact' and (coalesce(length(p_payload->>'name'), 0) not between 1 and 120 or coalesce(length(p_payload->>'message'), 0) not between 10 and 5000) then raise exception 'invalid message'; end if;
 insert into storefront_submission_limits(key, count, reset_at) values(p_rate_key, 1, now() + interval '1 minute')
 on conflict (key) do update set
 count = case when storefront_submission_limits.reset_at <= now() then 1 else storefront_submission_limits.count + 1 end,
 reset_at = case when storefront_submission_limits.reset_at <= now() then now() + interval '1 minute' else storefront_submission_limits.reset_at end
 returning count into v_count;
 if v_count > 5 then return 'limited'; end if;
 delete from storefront_submission_limits where reset_at < now() - interval '1 day';
 if p_kind = 'contact' then
 insert into contact_messages(name,email,message) values(p_payload->>'name', lower(p_payload->>'email'), p_payload->>'message');
 else
 insert into newsletter_subscribers(email) values(lower(p_payload->>'email')) on conflict (email) do nothing;
 end if;
 return 'saved';
end;
$$;
revoke all on function public.submit_storefront_form(text,jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_storefront_form(text,jsonb,text) to service_role;

alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_carrier text;
