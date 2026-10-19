-- Documents utiles (bibliothèque partagée avec les mosquées) et formulaires remplis en ligne.
-- À exécuter après 0002_cartes_visite.sql, dans Supabase → SQL Editor.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  category text not null default 'general' check (category in ('general', 'formulaire', 'contrat', 'technique', 'communication')),
  path text not null,
  file_name text not null,
  mime text,
  size integer not null default 0,
  visible_to_mosques boolean not null default true,
  -- Formulaire remplissable en ligne depuis l'espace mosquée (null = simple document).
  form_kind text check (form_kind in ('linky')),
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_submissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents on delete set null,
  form_kind text not null,
  mosque_id uuid references public.mosques on delete set null,
  submitted_by uuid references public.profiles on delete set null,
  data jsonb not null default '{}',
  pdf_path text not null,
  created_at timestamptz not null default now()
);
create index document_submissions_mosque_idx on public.document_submissions (mosque_id, created_at desc);

create trigger documents_touch
  before update on public.documents
  for each row execute function public.touch_updated_at();

alter table public.documents enable row level security;
alter table public.document_submissions enable row level security;
