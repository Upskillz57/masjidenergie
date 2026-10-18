-- Masjid Energie : demandes d'étude, espace admin et comptes mosquées.
-- À exécuter une fois dans Supabase → SQL Editor.
-- Toutes les lectures/écritures passent par le serveur Next (clé secrète) après vérification du rôle :
-- la RLS est activée sans politique, donc rien n'est accessible directement depuis le navigateur.

create table public.mosques (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  osm_ref text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'mosquee' check (role in ('admin', 'equipe', 'technique', 'mosquee')),
  mosque_id uuid references public.mosques on delete set null,
  created_at timestamptz not null default now()
);

-- Chaque utilisateur Supabase Auth reçoit un profil (rôle « mosquee » par défaut, ajusté par le serveur).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.study_requests (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'nouvelle'
    check (status in ('nouvelle', 'en_attente', 'en_cours', 'etude_envoyee', 'signee', 'installee', 'sans_suite')),
  mosque_name text not null,
  mosque_address text,
  mosque_osm text,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  chargers boolean not null default false,
  message text,
  assigned_to uuid references public.profiles on delete set null,
  mosque_id uuid references public.mosques on delete set null
);
create index study_requests_status_idx on public.study_requests (status, created_at desc);
create index study_requests_email_idx on public.study_requests (lower(email));

create table public.request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.study_requests on delete cascade,
  path text not null,
  name text not null,
  size integer not null default 0,
  mime text,
  kind text not null default 'facture' check (kind in ('facture', 'document')),
  uploaded_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index request_files_request_idx on public.request_files (request_id);

create table public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.study_requests on delete cascade,
  author_id uuid references public.profiles on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index request_comments_request_idx on public.request_comments (request_id, created_at);

-- Historique : changements de statut, d'assignation, ajouts de documents…
create table public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.study_requests on delete cascade,
  actor_id uuid references public.profiles on delete set null,
  type text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index request_events_request_idx on public.request_events (request_id, created_at);

create table public.account_requests (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  status text not null default 'en_attente' check (status in ('en_attente', 'approuvee', 'refusee')),
  mosque_name text not null,
  mosque_address text,
  first_name text not null,
  last_name text not null,
  role_in_mosque text,
  email text not null,
  phone text not null,
  message text,
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamptz,
  mosque_id uuid references public.mosques on delete set null
);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger study_requests_touch
  before update on public.study_requests
  for each row execute function public.touch_updated_at();

alter table public.mosques enable row level security;
alter table public.profiles enable row level security;
alter table public.study_requests enable row level security;
alter table public.request_files enable row level security;
alter table public.request_comments enable row level security;
alter table public.request_events enable row level security;
alter table public.account_requests enable row level security;

-- Factures et documents : bucket privé, lu uniquement via des liens signés générés par le serveur.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
