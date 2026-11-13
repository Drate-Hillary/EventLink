create or replace function public.ensure_accepted_booking_thread()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'accepted' and new.customer_id is not null then
    insert into public.threads (vendor_id, customer_id, customer_name)
    values (new.vendor_id, new.customer_id, new.customer_name)
    on conflict (vendor_id, customer_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger bookings_create_accepted_thread
  after insert or update on public.bookings
  for each row execute function public.ensure_accepted_booking_thread();
