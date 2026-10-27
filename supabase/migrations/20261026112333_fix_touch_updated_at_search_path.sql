/*
# Fix: set search_path on touch_updated_at

Linter flagged touch_updated_at as having a mutable search_path. Add fixed search_path.
*/

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon;