import { Workspace, type View } from "@/components/admin/workspace/workspace";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { listWorkspace } from "@/lib/admin/tasks-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const isId = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export default async function WorkspacePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { user, today, tasks, staff, requests, missingTables } = await listWorkspace();
  const view: View = one(sp.vue) === "calendrier" ? "calendrier" : "tableau";
  const task = one(sp.tache);
  const request = one(sp.demande);

  if (missingTables)
    return (
      <>
        <PageHeader eyebrow="ESPACE ADMIN" title="Espace de travail" />
        <EmptyState icon="check" title="L’espace de travail n’est pas encore activé">
          Exécutez le fichier <code>supabase/migrations/0005_espace_travail.sql</code> dans Supabase → SQL Editor, puis
          rechargez cette page.
        </EmptyState>
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow="ESPACE ADMIN"
        title="Espace de travail"
        description="Les tâches de toute l’équipe, reliées aux demandes d’étude. Glissez une carte pour la faire avancer, ouvrez-la pour l’assigner, la planifier ou en discuter."
      />
      <Workspace
        tasks={tasks}
        staff={staff}
        requests={requests}
        me={user.id}
        today={today}
        initialView={view}
        initialTask={isId(task) ? task : null}
        initialRequest={isId(request) ? request : null}
      />
    </>
  );
}
