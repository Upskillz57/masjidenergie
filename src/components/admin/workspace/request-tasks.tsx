"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { compareTasks, type Person, type Task } from "@/lib/tasks";
import { QuickAdd } from "./board";
import { Avatar, CheckButton, DueChip } from "./parts";
import { ToastBar, useTaskStore } from "./store";

// Carte « Tâches » de la page d'une demande : ce qu'il reste à faire sur ce dossier, ajout en une ligne.

export function RequestTasks({
  requestId,
  tasks: initial,
  staff,
  me,
  today,
}: {
  requestId: string;
  tasks: Task[];
  staff: Person[];
  me: string;
  today: string;
}) {
  const { tasks, create, update, toast, notify } = useTaskStore(initial, me);
  const [showDone, setShowDone] = useState(false);
  const people = useMemo(() => new Map(staff.map((p) => [p.id, p])), [staff]);
  const open = tasks.filter((t) => t.status !== "termine").sort((a, b) => compareTasks(a, b, today));
  const done = tasks.filter((t) => t.status === "termine").sort((a, b) => compareTasks(a, b, today));

  const row = (t: Task) => (
    <li key={t.id} className="flex items-start gap-2.5 py-2">
      <span className="mt-0.5">
        <CheckButton
          task={t}
          size="sm"
          onToggle={() => update(t.id, { status: t.status === "termine" ? "a_faire" : "termine" })}
        />
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <Link
          href={`/admin/travail?tache=${t.id}`}
          className={`text-[14px] font-medium leading-snug hover:text-brand-text hover:underline ${
            t.status === "termine" ? "text-muted line-through" : "text-heading"
          }`}
        >
          {t.priority === "haute" && t.status !== "termine" && <span className="mr-1 text-red-600 dark:text-red-400">!</span>}
          {t.title}
        </Link>
        {(t.status === "en_cours" || (t.due_date && t.status !== "termine")) && (
          <span className="flex flex-wrap items-center gap-1.5">
            {t.status === "en_cours" && (
              <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[11.5px] font-semibold text-violet-800 dark:bg-violet-400/15 dark:text-violet-300">
                En cours
              </span>
            )}
            <DueChip task={t} today={today} />
          </span>
        )}
      </div>
      {t.assigned_to && <Avatar person={people.get(t.assigned_to)} />}
    </li>
  );

  return (
    <>
      <QuickAdd placeholder="Ajouter une tâche à ce dossier…" onAdd={(title) => create({ title, request_id: requestId })} />
      {open.length === 0 && done.length === 0 && (
        <p className="py-1 text-[13px] text-muted">Aucune tâche pour l’instant : notez ici les prochaines étapes du dossier.</p>
      )}
      {open.length > 0 && <ul className="divide-y divide-line">{open.map(row)}</ul>}
      {open.length === 0 && done.length > 0 && <p className="py-1 text-[13px] text-muted">Tout est fait pour le moment.</p>}
      {done.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="mt-1 cursor-pointer text-[12.5px] font-semibold text-muted hover:text-fg"
          >
            {showDone ? "Masquer" : "Afficher"} {done.length} terminée{done.length > 1 ? "s" : ""}
          </button>
          {showDone && <ul className="divide-y divide-line">{done.map(row)}</ul>}
        </>
      )}
      <Link
        href={`/admin/travail?demande=${requestId}`}
        className="mt-3 flex items-center gap-1 text-[13px] font-semibold text-brand-text hover:underline"
      >
        Ouvrir dans l’espace de travail
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
      <ToastBar toast={toast} onClose={() => notify(null)} />
    </>
  );
}
