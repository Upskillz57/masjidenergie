-- Notifications de l'équipe : historique dans l'admin, notifications push (application installée) et préférences.
-- À exécuter après 0005_espace_travail.sql, dans Supabase → SQL Editor, AVANT de déployer le code qui l'utilise.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null,
  title text not null,
  body text,
  url text not null,
  actor_id uuid references public.profiles on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- Un abonnement par appareil (navigateur ou application installée).
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Préférences : e-mails pour ce qui vous concerne directement, catégories mises en sourdine.
alter table public.profiles
  add column notify_email boolean not null default true,
  add column notify_muted text[] not null default '{}';

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
