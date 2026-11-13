create table public.platform_billing_settings (
  singleton boolean primary key default true check (singleton),
  monthly_price_ugx bigint not null default 0 check (monthly_price_ugx >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
insert into public.platform_billing_settings (singleton) values (true);

create table public.provider_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  amount_ugx bigint not null check (amount_ugx > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  payment_reference text not null default '' check (length(payment_reference) <= 120),
  receipt_number text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  check (
    (status = 'paid' and paid_at is not null and period_start is not null and period_end is not null and receipt_number is not null)
    or (status <> 'paid' and paid_at is null and period_start is null and period_end is null and receipt_number is null)
  )
);
create index provider_subscription_payments_vendor_idx
  on public.provider_subscription_payments (vendor_id, created_at desc);
create unique index provider_subscription_payments_one_pending_idx
  on public.provider_subscription_payments (vendor_id) where status = 'pending';

alter table public.platform_billing_settings enable row level security;
alter table public.provider_subscription_payments enable row level security;

create policy "active users read billing price" on public.platform_billing_settings for select
  to authenticated using (public.is_active_user());
create policy "admins manage billing price" on public.platform_billing_settings for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "providers read own payments and admins read all" on public.provider_subscription_payments for select
  to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.vendors v
      where v.id = vendor_id and v.owner_id = auth.uid()
    )
  );
create policy "active providers submit payment requests" on public.provider_subscription_payments for insert
  to authenticated with check (public.is_active_user() and public.owns_vendor(vendor_id));
create policy "admins update payment status" on public.provider_subscription_payments for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.platform_billing_settings, public.provider_subscription_payments from public, anon, authenticated;
grant select, update on public.platform_billing_settings to authenticated;
grant select, insert, update (status) on public.provider_subscription_payments to authenticated;

create or replace function public.guard_subscription_payment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  price bigint;
begin
  if tg_op = 'INSERT' then
    if not public.is_active_user() or not public.owns_vendor(new.vendor_id) then
      raise exception 'Only an active provider can request a subscription';
    end if;
    select monthly_price_ugx into price
    from public.platform_billing_settings where singleton = true;
    if coalesce(price, 0) <= 0 then
      raise exception 'The administrator has not set a subscription price';
    end if;
    new.amount_ugx := price;
    new.status := 'pending';
    new.payment_reference := trim(coalesce(new.payment_reference, ''));
    return new;
  end if;

  if not public.is_admin() then
    raise exception 'Only administrators can confirm subscription payments';
  end if;
  if old.status <> 'pending' or new.status not in ('paid', 'rejected') then
    raise exception 'Only pending subscription payments can be reviewed';
  end if;
  if new.status = 'paid' then
    new.paid_at := now();
    select greatest(now(), coalesce(max(p.period_end), now())) into new.period_start
    from public.provider_subscription_payments p
    where p.vendor_id = old.vendor_id and p.status = 'paid';
    new.period_end := new.period_start + interval '1 month';
    new.receipt_number := 'EL-UGX-' || to_char(new.paid_at at time zone 'UTC', 'YYYYMMDD')
      || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  else
    new.paid_at := null;
    new.period_start := null;
    new.period_end := null;
    new.receipt_number := null;
  end if;
  return new;
end;
$$;
create trigger provider_subscription_payments_guard
  before insert or update on public.provider_subscription_payments
  for each row execute function public.guard_subscription_payment();

create or replace function public.notify_subscription_payment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  recipient uuid;
begin
  select owner_id into recipient from public.vendors where id = new.vendor_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    select p.id, 'payment', 'Provider payment needs review',
      'A subscription payment request was submitted for UGX ' || new.amount_ugx::text || '.',
      '/admin/billing', new.id
    from public.profiles p where p.role = 'admin' and p.status = 'active';
  elsif new.status = 'paid' and old.status is distinct from new.status then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      recipient, 'payment', 'Subscription payment confirmed',
      'Receipt ' || new.receipt_number || ' for UGX ' || new.amount_ugx::text || ' is ready in your billing page.',
      '/provider/billing', new.id
    );
  elsif new.status = 'rejected' and old.status is distinct from new.status then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      recipient, 'payment', 'Subscription payment not confirmed',
      'Your payment request was not confirmed. Check your payment details and contact EventLink support.',
      '/provider/billing', new.id
    );
  end if;
  return new;
end;
$$;
create trigger provider_subscription_payments_notify
  after insert or update of status on public.provider_subscription_payments
  for each row execute function public.notify_subscription_payment();

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('booking', 'message', 'verification', 'account', 'report', 'payment'));

create or replace function public.guard_booking()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'pending';
      if new.customer_id <> auth.uid() then
        raise exception 'Customers may only create requests for themselves';
      end if;
      if not exists (
        select 1 from public.vendors v
        where v.id = new.vendor_id and v.verification_status = 'verified'
      ) then
        raise exception 'Requests can only be sent to verified providers';
      end if;
      if new.event_id is not null and not exists (
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
     or new.customer_name is distinct from old.customer_name then
    raise exception 'Request details cannot be changed after submission';
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

alter publication supabase_realtime add table public.provider_subscription_payments;
