-- Maps and game data edited from editor.html / elements.html while collaborating.
-- Same shape as the repo files: maps/<name>.json and data/<name>.json.

create table public.maps (
  name text primary key check (name ~ '^[\w-]+$'),
  data jsonb not null
);

create table public.game_data (
  name text primary key check (name in ('towers', 'enemies', 'items', 'terrain', 'sprites')),
  data jsonb not null
);

-- Anyone can read (the deployed game loads from here), only logged in users write.
alter table public.maps enable row level security;
alter table public.game_data enable row level security;

create policy "read maps" on public.maps for select to anon, authenticated using (true);
create policy "insert maps" on public.maps for insert to authenticated with check (true);
create policy "update maps" on public.maps for update to authenticated using (true);

create policy "read game_data" on public.game_data for select to anon, authenticated using (true);
create policy "insert game_data" on public.game_data for insert to authenticated with check (true);
create policy "update game_data" on public.game_data for update to authenticated using (true);

-- Sprite PNGs, served by public URL.
insert into storage.buckets (id, name, public) values ('sprites', 'sprites', true);

create policy "upload sprites" on storage.objects for insert to authenticated with check (bucket_id = 'sprites');
create policy "replace sprites" on storage.objects for update to authenticated using (bucket_id = 'sprites');
create policy "read sprites" on storage.objects for select to authenticated using (bucket_id = 'sprites');
