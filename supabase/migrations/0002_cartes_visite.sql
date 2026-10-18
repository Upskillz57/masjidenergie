-- Cartes de visite numériques (équipe Masjid Energie, YGB Développement, mosquées).
-- À exécuter après 0001_espace_admin.sql, dans Supabase → SQL Editor.
-- Lecture publique et écritures passent par le serveur Next : RLS activée sans politique.

create table public.business_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  brand text not null check (brand in ('masjid', 'ygb', 'mosquee')),
  owner_id uuid references public.profiles on delete set null,
  mosque_id uuid references public.mosques on delete cascade,
  full_name text not null,
  job_title text,
  organization text not null,
  phone text,
  mobile text,
  email text,
  website text,
  address text,
  note text,
  published boolean not null default true,
  scans integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_cards_mosque_idx on public.business_cards (mosque_id);
create index business_cards_owner_idx on public.business_cards (owner_id);

create trigger business_cards_touch
  before update on public.business_cards
  for each row execute function public.touch_updated_at();

alter table public.business_cards enable row level security;

-- Compteur de consultations de la carte publique (appelé par le serveur).
create function public.increment_card_scans(card_slug text) returns void
language sql security definer set search_path = '' as $$
  update public.business_cards set scans = scans + 1 where slug = card_slug and published;
$$;
revoke execute on function public.increment_card_scans(text) from public, anon, authenticated;
