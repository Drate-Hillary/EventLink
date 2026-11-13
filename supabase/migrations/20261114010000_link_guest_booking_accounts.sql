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

  if current_setting('eventlink.claim_guest_booking_requests', true) = 'on'
     and old.customer_id is null
     and new.customer_id = auth.uid()
     and lower(old.customer_email) = lower(auth.jwt()->>'email')
     and (to_jsonb(new) - 'customer_id') = (to_jsonb(old) - 'customer_id') then
    return new;
  end if;

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

create or replace function public.claim_guest_booking_requests(p_guest_request_id uuid default null)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  request_id text := coalesce(p_guest_request_id::text, auth.jwt()->'user_metadata'->>'guest_request_id');
  user_email text := lower(auth.jwt()->>'email');
  claimed_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to link a guest request';
  end if;
  if not public.is_active_user()
     or not exists (
       select 1 from public.profiles p
       where p.id = auth.uid() and p.role = 'customer'
     ) then
    raise exception 'Only active customer accounts can link guest requests';
  end if;
  if request_id is null or user_email is null then
    return 0;
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and lower(u.email) = user_email
  ) then
    raise exception 'Confirm your email before linking this request';
  end if;

  perform set_config('eventlink.claim_guest_booking_requests', 'on', true);
  update public.bookings b
  set customer_id = auth.uid()
  where b.customer_id is null
    and b.guest_request_id::text = request_id
    and lower(b.customer_email) = user_email;
  get diagnostics claimed_count = row_count;
  if claimed_count = 0 and not exists (
    select 1 from public.bookings b
    where b.guest_request_id::text = request_id
      and b.customer_id = auth.uid()
  ) then
    raise exception 'No matching guest request was found for this account';
  end if;
  return claimed_count;
end;
$$;

revoke all on function public.claim_guest_booking_requests(uuid) from public, anon;
grant execute on function public.claim_guest_booking_requests(uuid) to authenticated;
