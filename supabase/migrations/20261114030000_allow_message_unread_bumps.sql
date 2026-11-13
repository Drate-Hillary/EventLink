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

  if pg_trigger_depth() > 1 then
    if new.customer_unread = old.customer_unread + 1
       and new.vendor_unread is not distinct from old.vendor_unread then
      return new;
    end if;
    if new.vendor_unread = old.vendor_unread + 1
       and new.customer_unread is not distinct from old.customer_unread then
      return new;
    end if;
    raise exception 'Nested conversation updates may only increment one unread count';
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
