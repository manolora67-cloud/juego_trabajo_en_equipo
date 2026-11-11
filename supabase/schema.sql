create table if not exists public.matches (
  id text primary key,
  completed_at timestamptz not null,
  player_one_name text not null check (char_length(btrim(player_one_name)) between 1 and 20),
  player_one_score smallint not null check (player_one_score between 0 and 10),
  player_two_name text not null check (char_length(btrim(player_two_name)) between 1 and 20),
  player_two_score smallint not null check (player_two_score between 0 and 10),
  winner_player smallint check (winner_player in (0, 1)),
  answers jsonb
);

alter table public.matches
  add column if not exists answers jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.matches'::regclass
      and conname = 'matches_player_one_name_no_digits'
  ) then
    alter table public.matches
      add constraint matches_player_one_name_no_digits
      check (player_one_name !~ '[0-9]') not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.matches'::regclass
      and conname = 'matches_player_two_name_no_digits'
  ) then
    alter table public.matches
      add constraint matches_player_two_name_no_digits
      check (player_two_name !~ '[0-9]') not valid;
  end if;
end
$$;

create index if not exists matches_completed_at_idx
  on public.matches (completed_at desc);

alter table public.matches enable row level security;

grant select, insert on public.matches to anon, authenticated;

drop policy if exists "Anyone can read matches" on public.matches;
create policy "Anyone can read matches"
  on public.matches for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can add matches" on public.matches;
create policy "Anyone can add matches"
  on public.matches for insert
  to anon, authenticated
  with check (true);
