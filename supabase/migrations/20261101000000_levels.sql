-- The story's levels (story.html) are saved as one more game_data row.
alter table public.game_data drop constraint game_data_name_check;
alter table public.game_data add constraint game_data_name_check
  check (name in ('towers', 'enemies', 'items', 'terrain', 'sprites', 'levels'));
