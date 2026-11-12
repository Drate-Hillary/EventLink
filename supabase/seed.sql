insert into public.categories (name, description) values
  ('Catering', 'Food, drink and service staff'),
  ('Photography', 'Photo and video coverage'),
  ('DJs & Music', 'DJs, bands and sound systems'),
  ('Tents & Seating', 'Tents, tables and chairs'),
  ('Decor', 'Florals, styling and lighting')
on conflict (name) do nothing;
