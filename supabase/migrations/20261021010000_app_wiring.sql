-- Wiring needed by the app's switch from mock data to Supabase.

-- Providers can't read customer profiles (RLS), so copy the customer's name
-- onto the rows they share.
alter table public.bookings add column customer_name text not null default '';
alter table public.threads  add column customer_name text not null default '';

create or replace function public.fill_customer_name()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select full_name into new.customer_name from public.profiles where id = new.customer_id;
  new.customer_name := coalesce(new.customer_name, '');
  return new;
end;
$$;
create trigger bookings_customer_name before insert on public.bookings
  for each row execute function public.fill_customer_name();
create trigger threads_customer_name before insert on public.threads
  for each row execute function public.fill_customer_name();

-- Providers register with { full_name, role: 'provider', business, category }.
-- Create their vendor row here so it exists even before email confirmation.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r public.user_role := case when meta ->> 'role' = 'provider'
                             then 'provider'::public.user_role
                             else 'customer'::public.user_role end;
  cat text;
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(meta ->> 'full_name', ''), r);

  if r = 'provider' then
    select name into cat from public.categories where name = meta ->> 'category';
    if cat is null then
      select name into cat from public.categories where active order by created_at limit 1;
    end if;
    insert into public.vendors (owner_id, name, category, email)
    values (new.id, coalesce(nullif(meta ->> 'business', ''), meta ->> 'full_name', 'My business'), cat, new.email);
  end if;
  return new;
end;
$$;

-- A message's `sender` must match the side the sender is actually on.
drop policy "message parties send" on public.messages;
create policy "message parties send" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.threads th
      where th.id = thread_id
        and ((sender = 'customer' and th.customer_id = auth.uid())
          or (sender = 'provider' and public.owns_vendor(th.vendor_id)))
    )
  );
