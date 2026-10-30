-- Dossier de chaque demande d'étude : contexte, motivation et pièces (autorisation Enedis, factures, vue aérienne).
-- À exécuter après 0003_documents.sql, dans Supabase → SQL Editor, AVANT de déployer le code qui l'utilise.

alter table public.study_requests
  add column project_motivations text[] not null default '{}',
  add column project_context text;

alter table public.request_files drop constraint request_files_kind_check;
alter table public.request_files
  add constraint request_files_kind_check check (kind in ('facture', 'enedis', 'toiture', 'document'));
