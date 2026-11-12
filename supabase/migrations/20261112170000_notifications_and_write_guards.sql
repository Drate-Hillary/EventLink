create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('booking', 'message', 'verification', 'account', 'report')),
  title text not null,
  body text not null default '',
  href text not null,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx
  on public.notifications (recipient_id) where read_at is null;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;
grant execute on function public.is_active_user() to anon, authenticated;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if current_setting('eventlink.allow_admin_bootstrap', true) = 'on' then
    return new;
  end if;
  if not public.is_admin()
     and (new.role <> old.role or new.status <> old.status or new.email <> old.email) then
    raise exception 'Only administrators can change role, status or email';
  end if;
  return new;
end;
$$;

create or replace function public.bootstrap_admin(p_email text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  target_id uuid;
begin
  if session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Run this function from the Supabase SQL Editor as a database administrator';
  end if;

  select p.id into target_id
  from public.profiles p
  where lower(p.email) = lower(trim(p_email))
  limit 1
  for update;

  if target_id is null then
    raise exception 'No profile found for that email; create the Auth user first';
  end if;

  perform set_config('eventlink.allow_admin_bootstrap', 'on', true);
  update public.profiles
  set role = 'admin', status = 'active'
  where id = target_id;
  return target_id;
end;
$$;
revoke all on function public.bootstrap_admin(text) from public, anon, authenticated;

alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "recipients read notifications" on public.notifications for select
  using (recipient_id = auth.uid() and public.is_active_user());
create policy "recipients mark notifications read" on public.notifications for update
  using (recipient_id = auth.uid() and public.is_active_user())
  with check (recipient_id = auth.uid() and public.is_active_user());

create or replace function public.guard_notification_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is distinct from old.recipient_id
     or new.id is distinct from old.id
     or new.recipient_id is distinct from old.recipient_id
     or new.kind is distinct from old.kind
     or new.title is distinct from old.title
     or new.body is distinct from old.body
     or new.href is distinct from old.href
     or new.related_id is distinct from old.related_id
     or new.created_at is distinct from old.created_at
     or (old.read_at is not null and new.read_at is distinct from old.read_at) then
    raise exception 'Recipients may only mark their own notifications as read';
  end if;
  return new;
end;
$$;
create trigger notifications_guard before update on public.notifications
  for each row execute function public.guard_notification_update();

create or replace function public.notify_booking_created()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  recipient uuid;
  business_name text;
begin
  select v.owner_id, v.name into recipient, business_name
  from public.vendors v where v.id = new.vendor_id;

  if recipient is not null then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      recipient, 'booking', 'New request received',
      'A customer sent a ' || new.kind::text || ' request to ' || coalesce(business_name, 'your business') || '.',
      '/provider/bookings', new.id
    );
  end if;
  return new;
end;
$$;
create trigger bookings_notify_created after insert on public.bookings
  for each row execute function public.notify_booking_created();

create or replace function public.notify_booking_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  business_name text;
begin
  if new.status is distinct from old.status then
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
create trigger bookings_notify_status after update of status on public.bookings
  for each row execute function public.notify_booking_status();

create or replace function public.notify_message()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  recipient uuid;
  customer uuid;
  business_owner uuid;
begin
  select th.customer_id, v.owner_id into customer, business_owner
  from public.threads th
  join public.vendors v on v.id = th.vendor_id
  where th.id = new.thread_id;

  if new.sender_id = customer then
    recipient := business_owner;
  else
    recipient := customer;
  end if;

  if recipient is not null and recipient <> new.sender_id then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      recipient, 'message', 'New message',
      left(new.body, 180),
      case when recipient = customer then '/customer#messages' else '/provider/messages' end,
      new.thread_id
    );
  end if;
  return new;
end;
$$;
create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_message();

create or replace function public.notify_provider_application()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, kind, title, body, href, related_id)
  select p.id, 'verification', 'Provider application received',
         new.name || ' submitted a provider profile for review.',
         '/admin/verification', new.id
  from public.profiles p
  where p.role = 'admin' and p.status = 'active';
  return new;
end;
$$;
create trigger vendors_notify_application after insert on public.vendors
  for each row execute function public.notify_provider_application();

create or replace function public.notify_provider_verification()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.verification_status is distinct from old.verification_status then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      new.owner_id, 'verification', 'Provider profile ' || new.verification_status::text,
      'Your business verification status was updated.',
      '/provider/profile', new.id
    );
  end if;
  return new;
end;
$$;
create trigger vendors_notify_verification after update of verification_status on public.vendors
  for each row execute function public.notify_provider_verification();

create or replace function public.request_provider_information(p_vendor_id uuid, p_note text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  recipient uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can request provider information';
  end if;
  if length(trim(coalesce(p_note, ''))) not between 1 and 2000 then
    raise exception 'The information request must contain 1 to 2000 characters';
  end if;

  select v.owner_id into recipient
  from public.vendors v
  where v.id = p_vendor_id;
  if recipient is null then
    raise exception 'Provider profile not found';
  end if;

  insert into public.notifications (recipient_id, kind, title, body, href, related_id)
  values (
    recipient, 'verification', 'More information requested',
    trim(p_note), '/provider/profile', p_vendor_id
  );
end;
$$;
revoke all on function public.request_provider_information(uuid, text) from public, anon;
grant execute on function public.request_provider_information(uuid, text) to authenticated;

create or replace function public.notify_account_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      new.id, 'account', 'Account status updated',
      'Your account status was changed to ' || new.status::text || '.',
      '/login', new.id
    );
  end if;
  return new;
end;
$$;
create trigger profiles_notify_status after update of status on public.profiles
  for each row execute function public.notify_account_status();

create or replace function public.notify_report_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.reporter_id is not null
     and (new.status is distinct from old.status or new.decision is distinct from old.decision) then
    insert into public.notifications (recipient_id, kind, title, body, href, related_id)
    values (
      new.reporter_id, 'report', 'Report updated',
      coalesce(nullif(new.decision, ''), 'Your report status is now ' || new.status::text || '.'),
      case
        when exists (select 1 from public.profiles p where p.id = new.reporter_id and p.role = 'provider')
          then '/provider'
        else '/customer'
      end,
      new.id
    );
  end if;
  return new;
end;
$$;
create trigger reports_notify_update after update of status, decision on public.reports
  for each row execute function public.notify_report_update();

create or replace function public.notify_report_created()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, kind, title, body, href, related_id)
  select p.id, 'report', 'New report submitted',
         'A user reported ' || new.target || '.',
         '/admin/reports', new.id
  from public.profiles p
  where p.role = 'admin' and p.status = 'active';
  return new;
end;
$$;
create trigger reports_notify_created after insert on public.reports
  for each row execute function public.notify_report_created();

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

  if new.status = 'accepted' and new.event_date is not null then
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
  return new;
end;
$$;

drop policy "booking parties update" on public.bookings;
drop policy "customer creates request" on public.bookings;
create policy "active customers create requests" on public.bookings for insert
  with check (
    customer_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'customer')
  );
create policy "providers update pending requests" on public.bookings for update
  using ((public.owns_vendor(vendor_id) and public.is_active_user()) or public.is_admin())
  with check ((public.owns_vendor(vendor_id) and public.is_active_user()) or public.is_admin());
revoke update on public.bookings from authenticated;
grant update (status) on public.bookings to authenticated;

create or replace function public.guard_thread_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.vendor_id is distinct from old.vendor_id
     or new.customer_id is distinct from old.customer_id
     or new.customer_name is distinct from old.customer_name
     or new.created_at is distinct from old.created_at then
    raise exception 'Conversation participants cannot be changed';
  end if;

  if old.customer_id = auth.uid() then
    if new.vendor_unread is distinct from old.vendor_unread
       or (new.customer_unread is distinct from old.customer_unread
           and not (old.customer_unread > 0 and new.customer_unread = 0)) then
      raise exception 'Customers may only clear their own unread count';
    end if;
  elsif public.owns_vendor(old.vendor_id) then
    if new.customer_unread is distinct from old.customer_unread
       or (new.vendor_unread is distinct from old.vendor_unread
           and not (old.vendor_unread > 0 and new.vendor_unread = 0)) then
      raise exception 'Providers may only clear their own unread count';
    end if;
  else
    raise exception 'Only conversation participants may update a conversation';
  end if;
  return new;
end;
$$;
create trigger threads_guard before update on public.threads
  for each row execute function public.guard_thread_update();

drop policy "thread parties update" on public.threads;
drop policy "customer opens thread" on public.threads;
create policy "active customers open verified vendor threads" on public.threads for insert
  with check (
    customer_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'customer')
    and exists (select 1 from public.vendors v where v.id = vendor_id and v.verification_status = 'verified')
  );
create policy "thread parties update" on public.threads for update
  using (
    (customer_id = auth.uid() or public.owns_vendor(vendor_id))
    and public.is_active_user()
  )
  with check (
    (customer_id = auth.uid() or public.owns_vendor(vendor_id))
    and public.is_active_user()
  );
revoke update on public.threads from authenticated;
grant update (customer_unread, vendor_unread) on public.threads to authenticated;

revoke update, delete on public.messages from authenticated;

drop policy "read own profile or admin" on public.profiles;
create policy "read own profile or admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy "verified vendors public" on public.vendors;
create policy "verified vendors public" on public.vendors for select
  using (
    verification_status = 'verified'
    or (owner_id = auth.uid() and public.is_active_user())
    or public.is_admin()
  );
drop policy "owner or admin updates vendor" on public.vendors;
create policy "owner or admin updates vendor" on public.vendors for update
  using ((owner_id = auth.uid() and public.is_active_user()) or public.is_admin())
  with check ((owner_id = auth.uid() and public.is_active_user()) or public.is_admin());

drop policy "owner manages packages" on public.packages;
create policy "owner manages packages" on public.packages for all
  using ((public.owns_vendor(vendor_id) and public.is_active_user()) or public.is_admin())
  with check ((public.owns_vendor(vendor_id) and public.is_active_user()) or public.is_admin());
drop policy "owner manages portfolio" on public.portfolio_items;
create policy "owner manages portfolio" on public.portfolio_items for all
  using ((public.owns_vendor(vendor_id) and public.is_active_user()) or public.is_admin())
  with check ((public.owns_vendor(vendor_id) and public.is_active_user()) or public.is_admin());
drop policy "owner manages blocked dates" on public.vendor_blocked_dates;
create policy "owner manages blocked dates" on public.vendor_blocked_dates for all
  using (public.owns_vendor(vendor_id) and public.is_active_user())
  with check (public.owns_vendor(vendor_id) and public.is_active_user());

drop policy "own events" on public.events;
create policy "own events" on public.events for all
  using ((customer_id = auth.uid() and public.is_active_user()) or public.is_admin())
  with check ((customer_id = auth.uid() and public.is_active_user()) or public.is_admin());
drop policy "own allocations" on public.budget_allocations;
create policy "own allocations" on public.budget_allocations for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and ((e.customer_id = auth.uid() and public.is_active_user()) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and ((e.customer_id = auth.uid() and public.is_active_user()) or public.is_admin())
    )
  );
drop policy "booking parties read" on public.bookings;
create policy "booking parties read" on public.bookings for select
  using (
    ((customer_id = auth.uid() or public.owns_vendor(vendor_id)) and public.is_active_user())
    or public.is_admin()
  );
drop policy "message parties read" on public.messages;
create policy "message parties read" on public.messages for select
  using ((public.in_thread(thread_id) and public.is_active_user()) or public.is_admin());
drop policy "message parties send" on public.messages;
create policy "message parties send" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_active_user()
    and exists (
      select 1 from public.threads th
      where th.id = thread_id
        and ((sender = 'customer' and th.customer_id = auth.uid())
          or (sender = 'provider' and public.owns_vendor(th.vendor_id)))
    )
  );
drop policy "file report" on public.reports;
create policy "file report" on public.reports for insert
  with check (reporter_id = auth.uid() and public.is_active_user());
drop policy "thread parties read" on public.threads;
create policy "thread parties read" on public.threads for select
  using (
    ((customer_id = auth.uid() or public.owns_vendor(vendor_id)) and public.is_active_user())
    or public.is_admin()
  );
drop policy "customer writes review" on public.reviews;
create policy "active customers write review" on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and public.is_active_user()
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'customer'
    )
    and exists (
      select 1 from public.bookings b
      where b.vendor_id = reviews.vendor_id
        and b.customer_id = auth.uid()
        and b.status = 'accepted'
    )
  );
drop policy "providers upload own portfolio" on storage.objects;
create policy "providers upload own portfolio" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_user()
    and exists (select 1 from public.vendors v where v.owner_id = auth.uid())
  );
drop policy "providers delete own portfolio" on storage.objects;
create policy "providers delete own portfolio" on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_user()
    and exists (select 1 from public.vendors v where v.owner_id = auth.uid())
  );
drop policy "owner or admin reads documents" on storage.objects;
create policy "owner or admin reads documents" on storage.objects for select to authenticated
  using (
    bucket_id = 'vendor-documents'
    and (
      ((storage.foldername(name))[1] = auth.uid()::text
        and public.is_active_user()
        and exists (select 1 from public.vendors v where v.owner_id = auth.uid()))
      or public.is_admin()
    )
  );
drop policy "providers upload own documents" on storage.objects;
create policy "providers upload own documents" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendor-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_user()
    and exists (select 1 from public.vendors v where v.owner_id = auth.uid())
  );

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end;
$$;
