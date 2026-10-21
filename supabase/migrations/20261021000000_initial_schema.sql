-- EventLink initial schema
-- Mirrors the shapes in src/types/index.ts and the actions in src/features/store.tsx.
-- Run once in the Supabase SQL editor, or with `supabase db push`.

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type public.user_role       as enum ('customer', 'provider', 'admin');
create type public.user_status     as enum ('active', 'suspended');
create type public.account_status  as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.booking_status  as enum ('pending', 'accepted', 'declined');
create type public.request_kind    as enum ('quote', 'booking');
create type public.report_status   as enum ('open', 'investigating', 'resolved');

-- ---------- Profiles (one per auth user) ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  role        public.user_role not null default 'customer',
  status      public.user_status not null default 'active',
  created_at  timestamptz not null default now()
);

-- Helpers used by the policies below. security definer so they can read
-- profiles/vendors without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

-- ---------- Service categories ----------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text not null default '',
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- Vendors (provider businesses) ----------
create table public.vendors (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null unique references public.profiles (id) on delete cascade,
  name                 text not null,
  category             text not null references public.categories (name) on update cascade,
  location             text not null default '',
  areas                text[] not null default '{}',
  about                text not null default '',
  phone                text not null default '',
  email                text not null default '',
  hue                  smallint not null default 0,
  available            boolean not null default true,
  verification_status  public.account_status not null default 'pending',
  documents            text[] not null default '{}',
  submitted_at         timestamptz not null default now(),
  created_at           timestamptz not null default now()
);
create index vendors_category_idx on public.vendors (category);

create or replace function public.owns_vendor(v uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.vendors where id = v and owner_id = auth.uid());
$$;

create table public.packages (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendors (id) on delete cascade,
  name         text not null,
  price        numeric(12, 2) not null check (price >= 0),
  description  text not null default '',
  includes     text[] not null default '{}',
  position     int not null default 0
);
create index packages_vendor_idx on public.packages (vendor_id);

create table public.portfolio_items (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendors (id) on delete cascade,
  title      text not null,
  image_url  text,
  hue        smallint not null default 0,
  position   int not null default 0
);
create index portfolio_vendor_idx on public.portfolio_items (vendor_id);

create table public.vendor_blocked_dates (
  vendor_id  uuid not null references public.vendors (id) on delete cascade,
  day        date not null,
  primary key (vendor_id, day)
);

-- ---------- Customer events + budget ----------
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.profiles (id) on delete cascade,
  name         text not null,
  type         text not null default 'Wedding',
  date         date,
  location     text not null default '',
  guests       int not null default 0 check (guests >= 0),
  budget       numeric(12, 2) not null default 0 check (budget >= 0),
  categories   text[] not null default '{}',
  created_at   timestamptz not null default now()
);
create index events_customer_idx on public.events (customer_id);

create table public.budget_allocations (
  event_id  uuid not null references public.events (id) on delete cascade,
  category  text not null references public.categories (name) on update cascade,
  amount    numeric(12, 2) not null default 0 check (amount >= 0),
  primary key (event_id, category)
);

-- ---------- Quote / booking requests ----------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events (id) on delete set null,
  vendor_id     uuid not null references public.vendors (id) on delete cascade,
  customer_id   uuid not null references public.profiles (id) on delete cascade,
  package_name  text not null default '',
  kind          public.request_kind not null default 'quote',
  status        public.booking_status not null default 'pending',
  note          text not null default '',
  event_date    date,
  created_at    timestamptz not null default now()
);
create index bookings_vendor_idx on public.bookings (vendor_id);
create index bookings_customer_idx on public.bookings (customer_id);

-- ---------- Reviews ----------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid not null references public.vendors (id) on delete cascade,
  customer_id  uuid references public.profiles (id) on delete set null,
  author       text not null,
  rating       smallint not null check (rating between 1 and 5),
  text         text not null default '',
  event_type   text not null default '',
  created_at   timestamptz not null default now()
);
create index reviews_vendor_idx on public.reviews (vendor_id);

-- Public marketplace view: rating, review count and starting price are derived, not stored.
create view public.vendor_cards with (security_invoker = true) as
select v.*,
       coalesce(round(avg(r.rating)::numeric, 1), 0) as rating,
       count(distinct r.id)::int                     as review_count,
       coalesce(min(p.price), 0)                     as price_from
from public.vendors v
left join public.reviews r  on r.vendor_id = v.id
left join public.packages p on p.vendor_id = v.id
group by v.id;

-- ---------- Messaging ----------
create table public.threads (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null references public.vendors (id) on delete cascade,
  customer_id      uuid not null references public.profiles (id) on delete cascade,
  customer_unread  int not null default 0,
  vendor_unread    int not null default 0,
  created_at       timestamptz not null default now(),
  unique (vendor_id, customer_id)
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.threads (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  sender      text not null check (sender in ('customer', 'provider')),
  body        text not null check (length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index messages_thread_idx on public.messages (thread_id, created_at);

create or replace function public.in_thread(t uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.threads th
    where th.id = t
      and (th.customer_id = auth.uid() or public.owns_vendor(th.vendor_id))
  );
$$;

-- ---------- Admin: reports + activity log ----------
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references public.profiles (id) on delete set null,
  target       text not null,
  reason       text not null,
  status       public.report_status not null default 'open',
  decision     text,
  created_at   timestamptz not null default now()
);

create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  target      text not null,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- Triggers
-- =====================================================================

-- Create a profile when someone signs up. The app passes
-- { full_name, role } in options.data of supabase.auth.signUp().
-- Admin can never be self-assigned; promote admins by hand in SQL.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r public.user_role := case when new.raw_user_meta_data ->> 'role' = 'provider'
                             then 'provider'::public.user_role
                             else 'customer'::public.user_role end;
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), r);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Non-admins may edit their own name, but not their role or status.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() and (new.role <> old.role or new.status <> old.status or new.email <> old.email) then
    raise exception 'Only admins can change role, status or email';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Providers can't verify themselves.
create or replace function public.guard_vendor_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.verification_status := 'pending';
    elsif new.verification_status <> old.verification_status then
      raise exception 'Only admins can change verification status';
    end if;
  end if;
  return new;
end;
$$;
create trigger vendors_guard before insert or update on public.vendors
  for each row execute function public.guard_vendor_status();

-- Customers create pending requests; only the vendor (or an admin) decides them.
-- Accepting is blocked when the date is unavailable or already accepted for someone else.
create or replace function public.guard_booking()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then new.status := 'pending'; end if;
    return new;
  end if;

  if new.status <> old.status then
    if not (public.owns_vendor(old.vendor_id) or public.is_admin()) then
      raise exception 'Only the vendor can accept or decline a request';
    end if;
    if new.status = 'accepted' and new.event_date is not null then
      if exists (select 1 from public.vendor_blocked_dates
                 where vendor_id = new.vendor_id and day = new.event_date) then
        raise exception 'This date is marked unavailable';
      end if;
      if exists (select 1 from public.bookings
                 where vendor_id = new.vendor_id and event_date = new.event_date
                   and status = 'accepted' and id <> new.id) then
        raise exception 'This date is already booked';
      end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger bookings_guard before insert or update on public.bookings
  for each row execute function public.guard_booking();

-- Keep thread unread counters in sync with new messages.
create or replace function public.bump_unread()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.threads
     set customer_unread = customer_unread + (new.sender = 'provider')::int,
         vendor_unread   = vendor_unread   + (new.sender = 'customer')::int
   where id = new.thread_id;
  return new;
end;
$$;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_unread();

-- =====================================================================
-- Row level security
-- =====================================================================
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.vendors              enable row level security;
alter table public.packages             enable row level security;
alter table public.portfolio_items      enable row level security;
alter table public.vendor_blocked_dates enable row level security;
alter table public.events               enable row level security;
alter table public.budget_allocations   enable row level security;
alter table public.bookings             enable row level security;
alter table public.reviews              enable row level security;
alter table public.threads              enable row level security;
alter table public.messages             enable row level security;
alter table public.reports              enable row level security;
alter table public.activity_log         enable row level security;

-- profiles
create policy "read own profile or admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "update own profile or admin" on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- categories: everyone reads, admins write
create policy "categories readable" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- vendors: public sees verified ones; owners see their own; admins see all
create policy "verified vendors public" on public.vendors for select
  using (verification_status = 'verified' or owner_id = auth.uid() or public.is_admin());
create policy "provider creates own vendor" on public.vendors for insert
  with check (owner_id = auth.uid()
              and exists (select 1 from public.profiles where id = auth.uid() and role = 'provider'));
create policy "owner or admin updates vendor" on public.vendors for update
  using (owner_id = auth.uid() or public.is_admin());
create policy "admin deletes vendor" on public.vendors for delete using (public.is_admin());

-- vendor child tables: readable when the vendor is, writable by owner/admin
create policy "packages readable" on public.packages for select
  using (exists (select 1 from public.vendors v where v.id = vendor_id));
create policy "owner manages packages" on public.packages for all
  using (public.owns_vendor(vendor_id) or public.is_admin())
  with check (public.owns_vendor(vendor_id) or public.is_admin());

create policy "portfolio readable" on public.portfolio_items for select
  using (exists (select 1 from public.vendors v where v.id = vendor_id));
create policy "owner manages portfolio" on public.portfolio_items for all
  using (public.owns_vendor(vendor_id) or public.is_admin())
  with check (public.owns_vendor(vendor_id) or public.is_admin());

create policy "blocked dates readable" on public.vendor_blocked_dates for select
  using (exists (select 1 from public.vendors v where v.id = vendor_id));
create policy "owner manages blocked dates" on public.vendor_blocked_dates for all
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));

-- events + allocations: private to the customer
create policy "own events" on public.events for all
  using (customer_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid());
create policy "own allocations" on public.budget_allocations for all
  using (exists (select 1 from public.events e where e.id = event_id and e.customer_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = event_id and e.customer_id = auth.uid()));

-- bookings: customer, the vendor, and admins can read
create policy "booking parties read" on public.bookings for select
  using (customer_id = auth.uid() or public.owns_vendor(vendor_id) or public.is_admin());
create policy "customer creates request" on public.bookings for insert
  with check (customer_id = auth.uid());
create policy "booking parties update" on public.bookings for update
  using (customer_id = auth.uid() or public.owns_vendor(vendor_id) or public.is_admin());

-- reviews: public read; a customer reviews a vendor they have an accepted booking with
create policy "reviews readable" on public.reviews for select using (true);
create policy "customer writes review" on public.reviews for insert
  with check (customer_id = auth.uid()
              and exists (select 1 from public.bookings b
                          where b.vendor_id = reviews.vendor_id and b.customer_id = auth.uid()
                            and b.status = 'accepted'));
create policy "admin removes review" on public.reviews for delete using (public.is_admin());

-- threads + messages: only the two parties (admins can read for moderation)
create policy "thread parties read" on public.threads for select
  using (customer_id = auth.uid() or public.owns_vendor(vendor_id) or public.is_admin());
create policy "customer opens thread" on public.threads for insert
  with check (customer_id = auth.uid());
create policy "thread parties update" on public.threads for update
  using (customer_id = auth.uid() or public.owns_vendor(vendor_id));

create policy "message parties read" on public.messages for select
  using (public.in_thread(thread_id) or public.is_admin());
create policy "message parties send" on public.messages for insert
  with check (sender_id = auth.uid() and public.in_thread(thread_id));

-- reports: anyone signed in can file; admins triage
create policy "file report" on public.reports for insert
  with check (reporter_id = auth.uid());
create policy "admins read reports" on public.reports for select using (public.is_admin());
create policy "admins update reports" on public.reports for update using (public.is_admin());

-- activity log: admins only
create policy "admins read activity" on public.activity_log for select using (public.is_admin());
create policy "admins write activity" on public.activity_log for insert
  with check (public.is_admin() and actor_id = auth.uid());

-- =====================================================================
-- API grants (explicit, so the Data API works regardless of project defaults)
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.vendors, public.vendor_cards, public.packages,
                public.portfolio_items, public.vendor_blocked_dates, public.reviews to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_admin(), public.owns_vendor(uuid), public.in_thread(uuid) to anon, authenticated;

-- =====================================================================
-- Realtime for chat, and storage for portfolio photos / verification docs
-- =====================================================================
alter publication supabase_realtime add table public.messages;

insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('vendor-documents', 'vendor-documents', false)
  on conflict (id) do nothing;

-- Files go under "<auth uid>/filename" so ownership is the first folder.
create policy "portfolio images public" on storage.objects for select
  using (bucket_id = 'portfolio');
create policy "providers upload own portfolio" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "providers delete own portfolio" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner or admin reads documents" on storage.objects for select to authenticated
  using (bucket_id = 'vendor-documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "providers upload own documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'vendor-documents' and (storage.foldername(name))[1] = auth.uid()::text);
