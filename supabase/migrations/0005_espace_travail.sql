-- Espace de travail de l'équipe : tâches (à faire, en cours, terminées) reliées aux demandes d'étude,
-- planifiées dans un calendrier, avec commentaires.
-- À exécuter après 0004_dossier_mosquee.sql, dans Supabase → SQL Editor, AVANT de déployer le code qui l'utilise.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 5000),
  status text not null default 'a_faire' check (status in ('a_faire', 'en_cours', 'termine')),
  priority text not null default 'normale' check (priority in ('basse', 'normale', 'haute')),
  -- Échéance (jour) et heure facultative : la tâche apparaît ce jour-là dans le calendrier.
  due_date date,
  due_time time,
  request_id uuid references public.study_requests on delete set null,
  assigned_to uuid references public.profiles on delete set null,
  created_by uuid references public.profiles on delete set null,
  completed_by uuid references public.profiles on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_status_idx on public.tasks (status, due_date);
create index tasks_assignee_idx on public.tasks (assigned_to, status);
create index tasks_request_idx on public.tasks (request_id);

create trigger tasks_touch
  before update on public.tasks
  for each row execute function public.touch_updated_at();

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks on delete cascade,
  author_id uuid references public.profiles on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index task_comments_task_idx on public.task_comments (task_id, created_at);

-- Comme le reste de l'admin : tout passe par le serveur Next après vérification du rôle.
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
