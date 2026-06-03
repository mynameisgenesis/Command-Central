drop policy if exists "Anyone can read lights" on public.lights;
drop policy if exists "Anyone can create lights" on public.lights;
drop policy if exists "Anyone can update lights" on public.lights;
drop policy if exists "Anyone can delete lights" on public.lights;

create policy "Signed-in users can read lights"
on public.lights
for select
to authenticated
using (true);

create policy "Signed-in users can create lights"
on public.lights
for insert
to authenticated
with check (true);

create policy "Signed-in users can update lights"
on public.lights
for update
to authenticated
using (true)
with check (true);

create policy "Signed-in users can delete lights"
on public.lights
for delete
to authenticated
using (true);

revoke select, insert, update, delete on public.lights from anon;
grant select, insert, update, delete on public.lights to authenticated;
