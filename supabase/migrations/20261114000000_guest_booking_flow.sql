alter table public.bookings
  alter column customer_id drop not null,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists customer_location text,
  add column if not exists guest_request_id uuid;

create index if not exists bookings_guest_request_idx
  on public.bookings (guest_request_id)
  where guest_request_id is not null;
create unique index if not exists bookings_one_accepted_guest_request_idx
  on public.bookings (guest_request_id)
  where guest_request_id is not null and status = 'accepted';

create or replace function public.fill_customer_name()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.customer_id is not null then
    select coalesce(full_name, '') into new.customer_name
    from public.profiles
    where id = new.customer_id;
  elsif new.customer_name is null then
    new.customer_name := '';
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_customer_name on public.bookings;
create trigger bookings_customer_name before insert on public.bookings
  for each row execute function public.fill_customer_name();

create or replace function public.notify_booking_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  business_name text;
begin
  if new.customer_id is not null and new.status is distinct from old.status then
    select v.name into business_name from public.vendors v where v.id = new.vendor_id;
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      new.customer_id, 'booking', 'Request ' || new.status::text,
      'Your request to ' || coalesce(business_name, 'the provider') || ' has been ' || new.status::text || '.',
      '/customer#requests', new.id
    );
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_notify_status on public.bookings;
create trigger bookings_notify_status after update of status on public.bookings
  for each row execute function public.notify_booking_status();

create or replace function public.close_guest_request_after_accept()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'accepted' and new.guest_request_id is not null then
    update public.bookings
    set status = 'declined'
    where guest_request_id = new.guest_request_id
      and id <> new.id
      and status = 'pending';
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_close_guest_request on public.bookings;
create trigger bookings_close_guest_request
  after update of status on public.bookings
  for each row execute function public.close_guest_request_after_accept();

create or replace function public.guard_booking()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'pending';

      if new.customer_id is not null and new.customer_id <> auth.uid() then
        raise exception 'Customers may only create requests for themselves';
      end if;

      if new.customer_id is null then
        if auth.uid() is not null
           or new.event_id is not null
           or new.guest_request_id is null
           or trim(coalesce(new.customer_name, '')) = ''
           or trim(coalesce(new.customer_email, '')) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
           or trim(coalesce(new.customer_phone, '')) = ''
           or trim(coalesce(new.customer_location, '')) = '' then
          raise exception 'Guest requests require a name, valid email, phone, location and request id';
        end if;
      end if;

      if not exists (
        select 1 from public.vendors v
        where v.id = new.vendor_id and v.verification_status = 'verified'
      ) then
        raise exception 'Requests can only be sent to verified providers';
      end if;

      if new.customer_id is not null and new.event_id is not null and not exists (
        select 1 from public.events e
        where e.id = new.event_id and e.customer_id = auth.uid()
      ) then
        raise exception 'The selected event does not belong to this customer';
      end if;
    end if;
    return new;
  end if;

  if public.is_admin() then return new; end if;

  if new.id is distinct from old.id
     or new.event_id is distinct from old.event_id
     or new.vendor_id is distinct from old.vendor_id
     or new.customer_id is distinct from old.customer_id
     or new.package_name is distinct from old.package_name
     or new.kind is distinct from old.kind
     or new.note is distinct from old.note
     or new.event_date is distinct from old.event_date
     or new.created_at is distinct from old.created_at
     or new.customer_name is distinct from old.customer_name
     or new.customer_email is distinct from old.customer_email
     or new.customer_phone is distinct from old.customer_phone
     or new.customer_location is distinct from old.customer_location
     or new.guest_request_id is distinct from old.guest_request_id then
    raise exception 'Request details cannot be changed after submission';
  end if;

  if pg_trigger_depth() > 1 then
    if old.status = 'pending'
       and new.status = 'declined'
       and old.guest_request_id is not null
       and exists (
         select 1 from public.bookings b
         where b.guest_request_id = old.guest_request_id
           and b.status = 'accepted'
       ) then
      return new;
    end if;
    raise exception 'Nested booking updates are not allowed';
  end if;

  if not public.owns_vendor(old.vendor_id) then
    raise exception 'Only the provider can update a request';
  end if;
  if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'Only pending requests can be accepted or declined';
  end if;

  if new.status = 'accepted' then
    perform 1 from public.vendors where id = new.vendor_id for update;
    if (
      select count(*) from public.bookings
      where vendor_id = new.vendor_id and status = 'accepted' and id <> new.id
    ) >= 5 and not exists (
      select 1 from public.provider_subscription_payments p
      where p.vendor_id = new.vendor_id and p.status = 'paid'
        and p.period_start <= now() and p.period_end > now()
    ) then
      raise exception 'Your five free accepted bookings are used. An active monthly subscription is required.';
    end if;

    if new.guest_request_id is not null then
      if exists (
        select 1 from public.bookings b
        where b.guest_request_id = new.guest_request_id
          and b.id <> new.id
          and b.status = 'accepted'
      ) then
        raise exception 'This guest request has already been accepted by another provider';
      end if;
    end if;

    if new.event_date is not null then
      perform pg_advisory_xact_lock(
        hashtextextended(new.vendor_id::text || ':' || new.event_date::text, 0)
      );
      if exists (
        select 1 from public.vendor_blocked_dates
        where vendor_id = new.vendor_id and day = new.event_date
      ) then
        raise exception 'This date is marked unavailable';
      end if;
      if exists (
        select 1 from public.bookings
        where vendor_id = new.vendor_id and event_date = new.event_date
          and status = 'accepted' and id <> new.id
      ) then
        raise exception 'This date is already booked';
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_guard on public.bookings;
create trigger bookings_guard before insert or update on public.bookings
  for each row execute function public.guard_booking();

drop policy if exists "active customers create requests" on public.bookings;
create policy "customers and guests create requests" on public.bookings for insert
  with check (
    (
      customer_id = auth.uid()
      and public.is_active_user()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'customer')
    )
    or (
      customer_id is null
      and trim(coalesce(customer_name, '')) <> ''
      and trim(coalesce(customer_email, '')) <> ''
      and trim(coalesce(customer_phone, '')) <> ''
      and trim(coalesce(customer_location, '')) <> ''
      and guest_request_id is not null
      and auth.uid() is null
      and exists (
        select 1 from public.vendors v
        where v.id = vendor_id and v.verification_status = 'verified'
      )
    )
  );

grant insert on public.bookings to anon;

do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end;
$$;
