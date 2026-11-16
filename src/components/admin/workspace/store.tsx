"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTask, deleteTask, updateTask, type TaskResult } from "@/app/actions/tasks";
import type { Task, TaskPatch } from "@/lib/tasks";

// État des tâches côté navigateur : chaque modification s'affiche immédiatement (mise à jour optimiste),
// puis l'action serveur enregistre et la page se rafraîchit avec les données de toute l'équipe.
// Les opérations sont idempotentes : les rejouer sur des données déjà à jour ne change rien.

type Op = { key: number; apply: (tasks: Task[]) => Task[]; done: boolean };
export type Toast = { message: string; tone?: "error" | "info"; undo?: () => void };

export function useTaskStore(initial: Task[], me: string) {
  const [ops, setOps] = useState<Op[]>([]);
  const [base, setBase] = useState(initial);
  // Nouvelles données du serveur : les opérations déjà enregistrées y sont incluses.
  if (initial !== base) {
    setBase(initial);
    setOps((list) => list.filter((o) => !o.done));
  }
  const tasks = useMemo(() => ops.reduce((t, o) => o.apply(t), initial), [initial, ops]);

  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const notify = useCallback((t: Toast | null) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    if (t) toastTimer.current = setTimeout(() => setToast(null), t.undo ? 6000 : 4000);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const counter = useRef(0);
  const run = useCallback(
    (apply: Op["apply"], save: () => Promise<TaskResult>) => {
      const key = ++counter.current;
      setOps((list) => [...list, { key, apply, done: false }]);
      startTransition(async () => {
        let res: TaskResult;
        try {
          res = await save();
        } catch {
          res = { ok: false, message: "Connexion perdue : la modification n’a pas été enregistrée." };
        }
        setOps((list) =>
          res.ok ? list.map((o) => (o.key === key ? { ...o, done: true } : o)) : list.filter((o) => o.key !== key),
        );
        if (!res.ok) notify({ message: res.message, tone: "error" });
      });
    },
    [notify],
  );

  const create = useCallback(
    (patch: TaskPatch & { title: string }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const task: Task = {
        id,
        description: null,
        status: "a_faire",
        priority: "normale",
        due_date: null,
        due_time: null,
        request_id: null,
        assigned_to: null,
        created_by: me,
        completed_at: null,
        created_at: now,
        updated_at: now,
        comments: 0,
        ...patch,
      };
      if (task.status === "termine") task.completed_at = now;
      run(
        (list) => (list.some((t) => t.id === id) ? list : [...list, task]),
        () => createTask(id, patch),
      );
      return id;
    },
    [me, run],
  );

  const update = useCallback(
    (id: string, patch: TaskPatch) => {
      const now = new Date().toISOString();
      run(
        (list) =>
          list.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch };
            if (patch.status && patch.status !== t.status) next.completed_at = patch.status === "termine" ? now : null;
            return next;
          }),
        () => updateTask(id, patch),
      );
    },
    [run],
  );

  /** Suppression différée de quelques secondes, le temps de pouvoir annuler. */
  const remove = useCallback(
    (task: Task) => {
      const key = ++counter.current;
      setOps((list) => [...list, { key, apply: (l) => l.filter((t) => t.id !== task.id), done: false }]);
      const timer = setTimeout(() => {
        startTransition(async () => {
          const res = await deleteTask(task.id).catch(() => ({ ok: false as const, message: "Suppression impossible." }));
          setOps((list) =>
            res.ok ? list.map((o) => (o.key === key ? { ...o, done: true } : o)) : list.filter((o) => o.key !== key),
          );
          if (!res.ok) notify({ message: res.message, tone: "error" });
        });
      }, 5500);
      notify({
        message: `« ${task.title} » supprimée`,
        undo: () => {
          clearTimeout(timer);
          setOps((list) => list.filter((o) => o.key !== key));
          notify(null);
        },
      });
    },
    [notify],
  );

  /** Commentaire ajouté ou supprimé dans le panneau : met à jour le compteur sur la carte. */
  const bumpComments = useCallback((id: string, delta: number) => {
    const key = ++counter.current;
    setOps((list) => [
      ...list,
      {
        key,
        apply: (l) => l.map((t) => (t.id === id ? { ...t, comments: Math.max(0, t.comments + delta) } : t)),
        // Pas d'action serveur associée : effacé au prochain rafraîchissement, qui inclut déjà le commentaire.
        done: true,
      },
    ]);
  }, []);

  return { tasks, create, update, remove, bumpComments, toast, notify };
}

export function ToastBar({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-brand-deep px-4 py-3 text-[14px] text-white shadow-[0_12px_32px_#00000040] sm:bottom-6"
    >
      <span className={`size-2 flex-none rounded-full ${toast.tone === "error" ? "bg-red-400" : "bg-accent"}`} />
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.undo && (
        <button type="button" onClick={toast.undo} className="cursor-pointer font-bold text-gold hover:underline">
          Annuler
        </button>
      )}
      <button type="button" onClick={onClose} aria-label="Fermer" className="cursor-pointer text-white/60 hover:text-white">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
