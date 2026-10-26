-- Kita-Helfer: einmalig im Supabase-Dashboard unter "SQL Editor" ausführen.
-- Legt eine Tabelle für die verschlüsselten Einträge und einen privaten Speicher für die verschlüsselten Fotos an.
-- Jede Person sieht nur ihre eigenen Daten (Row Level Security).

create sequence if not exists public.kh_rev_seq;

create table if not exists public.kh_docs (
  owner   uuid    not null default auth.uid() references auth.users on delete cascade,
  name    text    not null,
  body    jsonb,
  deleted boolean not null default false,
  rev     bigint  not null default nextval('public.kh_rev_seq'),
  primary key (owner, name)
);

create or replace function public.kh_bump_rev() returns trigger
language plpgsql set search_path = public as $$
begin
  new.rev := nextval('public.kh_rev_seq');
  return new;
end $$;

drop trigger if exists kh_docs_rev on public.kh_docs;
create trigger kh_docs_rev before update on public.kh_docs
  for each row execute function public.kh_bump_rev();

alter table public.kh_docs enable row level security;
drop policy if exists "nur eigene Eintraege" on public.kh_docs;
create policy "nur eigene Eintraege" on public.kh_docs
  for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

grant select, insert, update, delete on public.kh_docs to authenticated;
grant usage, select on sequence public.kh_rev_seq to authenticated;

-- Privater Speicher für die verschlüsselten Fotos, ein Ordner pro Person
insert into storage.buckets (id, name, public) values ('kh-blobs', 'kh-blobs', false)
  on conflict (id) do nothing;

drop policy if exists "kh eigene Fotos lesen" on storage.objects;
drop policy if exists "kh eigene Fotos anlegen" on storage.objects;
drop policy if exists "kh eigene Fotos aendern" on storage.objects;
drop policy if exists "kh eigene Fotos loeschen" on storage.objects;
create policy "kh eigene Fotos lesen" on storage.objects for select to authenticated
  using (bucket_id = 'kh-blobs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kh eigene Fotos anlegen" on storage.objects for insert to authenticated
  with check (bucket_id = 'kh-blobs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kh eigene Fotos aendern" on storage.objects for update to authenticated
  using (bucket_id = 'kh-blobs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kh eigene Fotos loeschen" on storage.objects for delete to authenticated
  using (bucket_id = 'kh-blobs' and (storage.foldername(name))[1] = auth.uid()::text);
