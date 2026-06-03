create type public.light_status as enum ('red', 'yellow', 'green');

create table public.lights (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.light_status not null default 'yellow',
  sort_order bigint not null default (
    floor(extract(epoch from clock_timestamp()) * 1000)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lights_name_not_blank check (length(trim(name)) > 0)
);

create unique index lights_name_lower_key on public.lights (lower(name));

create or replace function public.set_lights_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_lights_updated_at
before update on public.lights
for each row
execute function public.set_lights_updated_at();

alter table public.lights enable row level security;

create policy "Anyone can read lights"
on public.lights
for select
to anon, authenticated
using (true);

create policy "Anyone can create lights"
on public.lights
for insert
to anon, authenticated
with check (true);

create policy "Anyone can update lights"
on public.lights
for update
to anon, authenticated
using (true)
with check (true);

create policy "Anyone can delete lights"
on public.lights
for delete
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.lights to anon, authenticated;

insert into public.lights (name, status, sort_order)
values
  ('Dinner', 'yellow', 1),
  ('Nap', 'red', 2),
  ('Homework', 'green', 3),
  ('Laundry', 'yellow', 4),
  ('Garage', 'green', 5),
  ('Quiet Time', 'red', 6)
on conflict do nothing;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lights'
  ) then
    alter publication supabase_realtime add table public.lights;
  end if;
end
$$;
