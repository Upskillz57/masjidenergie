"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  compareTasks,
  personName,
  TASK_STATUSES,
  weekStart,
  type Person,
  type RequestOption,
  type Task,
  type TaskPatch,
  type TaskStatus,
} from "@/lib/tasks";
import { Board } from "./board";
import { WorkCalendar } from "./calendar";
import { Avatar, type Lookup } from "./parts";
import { ToastBar, useTaskStore } from "./store";
import { TaskDrawer } from "./task-drawer";

// Espace de travail : tableau et calendrier de la même liste de tâches, filtrés de la même façon.

export type View = "tableau" | "calendrier";
type Scope = "tous" | "moi" | "libres" | string;

/** Garde la vue et la tâche ouverte dans l'adresse (lien partageable). */
function syncUrl(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.replaceState(null, "", url);
}

export function Workspace({
  tasks: initialTasks,
  staff,
  requests,
  me,
  today,
  initialView,
  initialTask,
  initialRequest,
}: {
  tasks: Task[];
  staff: Person[];
  requests: RequestOption[];
  me: string;
  today: string;
  initialView: View;
  initialTask: string | null;
  initialRequest: string | null;
}) {
  const { tasks, create, update, remove, bumpComments, toast, notify } = useTaskStore(initialTasks, me);
  const [view, setView] = useState<View>(initialView);
  const [openId, setOpenId] = useState<string | null>(initialTask);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("tous");
  const [requestFilter, setRequestFilter] = useState(initialRequest ?? "");
  const [query, setQuery] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const lookup: Lookup = useMemo(
    () => ({
      people: new Map(staff.map((p) => [p.id, p])),
      requests: new Map(requests.map((r) => [r.id, r])),
      today,
      me,
    }),
    [staff, requests, today, me],
  );

  const open = useCallback((id: string | null) => {
    setOpenId(id);
    setFreshId(null);
    syncUrl({ tache: id });
  }, []);
  const switchView = useCallback((v: View) => {
    setView(v);
    syncUrl({ vue: v === "tableau" ? null : v });
  }, []);

  // Raccourci « N » : nouvelle tâche.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]");
      if (typing || e.metaKey || e.ctrlKey || e.altKey || openId) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        if (view !== "tableau") switchView("tableau");
        requestAnimationFrame(() => quickAddRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, view, switchView]);

  // --- Filtres -------------------------------------------------------------------
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (scope === "moi" && t.assigned_to !== me) return false;
        if (scope === "libres" && t.assigned_to) return false;
        if (scope !== "tous" && scope !== "moi" && scope !== "libres" && t.assigned_to !== scope) return false;
        if (requestFilter && t.request_id !== requestFilter) return false;
        if (lateOnly && !(t.status !== "termine" && t.due_date && t.due_date < today)) return false;
        if (q) {
          const r = t.request_id ? lookup.requests.get(t.request_id) : undefined;
          const hay = `${t.title} ${t.description ?? ""} ${r ? `${r.mosque_name} ${r.number}` : ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [tasks, scope, me, requestFilter, lateOnly, today, q, lookup],
  );
  const columns = useMemo(() => {
    const cols = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as Task[]])) as Record<TaskStatus, Task[]>;
    for (const t of filtered) cols[t.status].push(t);
    for (const s of TASK_STATUSES) cols[s].sort((a, b) => compareTasks(a, b, today));
    return cols;
  }, [filtered, today]);

  // --- Indicateurs (toute l'équipe, hors filtres) -------------------------------
  const stats = useMemo(() => {
    const openTasks = tasks.filter((t) => t.status !== "termine");
    const weekEnd = addDays(weekStart(today), 6);
    const weekMonday = `${weekStart(today)}T00:00:00`;
    return {
      mineUrgent: openTasks.filter((t) => t.assigned_to === me && t.due_date && t.due_date <= today).length,
      mine: openTasks.filter((t) => t.assigned_to === me).length,
      late: openTasks.filter((t) => t.due_date && t.due_date < today).length,
      week: openTasks.filter((t) => t.due_date && t.due_date >= today && t.due_date <= weekEnd).length,
      free: openTasks.filter((t) => !t.assigned_to).length,
      done: tasks.filter((t) => t.status === "termine" && (t.completed_at ?? "") >= weekMonday).length,
    };
  }, [tasks, today, me]);

  // --- Actions -----------------------------------------------------------------
  /** Une tâche créée hérite du contexte affiché : personne filtrée, demande filtrée. */
  const context = (): TaskPatch => ({
    assigned_to: scope === "moi" ? me : scope !== "tous" && scope !== "libres" ? scope : null,
    request_id: requestFilter || null,
  });
  const quickAdd = (title: string, patch: TaskPatch) => {
    create({ title, ...context(), ...patch });
  };
  const newTask = () => {
    const id = create({ title: "Nouvelle tâche", ...context(), ...(view === "calendrier" ? { due_date: today } : {}) });
    setOpenId(id);
    setFreshId(id);
    syncUrl({ tache: id });
  };
  const toggle = (t: Task) => {
    const done = t.status !== "termine";
    update(t.id, { status: done ? "termine" : "a_faire" });
    if (done)
      notify({
        message: `« ${t.title} » terminée`,
        undo: () => {
          update(t.id, { status: t.status });
          notify(null);
        },
      });
  };
  const move = (id: string, status: TaskStatus) => {
    const t = tasks.find((x) => x.id === id);
    if (t && t.status !== status) update(id, { status });
  };
  const reschedule = (id: string, day: string | null) => {
    const t = tasks.find((x) => x.id === id);
    if (t && t.due_date !== day) update(id, day ? { due_date: day } : { due_date: null, due_time: null });
  };

  const openTask = openId ? tasks.find((t) => t.id === openId) : undefined;
  const filtersOn = scope !== "tous" || requestFilter || lateOnly || q;
  const activeRequests = useMemo(() => {
    const used = new Set(tasks.map((t) => t.request_id));
    return requests.filter((r) => used.has(r.id) || r.id === requestFilter);
  }, [tasks, requests, requestFilter]);

  const tile = (on: boolean) =>
    `grid cursor-pointer gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors ${
      on ? "border-brand bg-brand text-white" : "border-line bg-card text-fg hover:border-brand-text/40"
    }`;
  const sub = (on: boolean) => (on ? "text-white/80" : "text-muted");

  return (
    <>
      {/* Indicateurs cliquables : ils appliquent le filtre correspondant. */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <button type="button" aria-pressed={scope === "moi"} onClick={() => setScope(scope === "moi" ? "tous" : "moi")} className={tile(scope === "moi")}>
          <span className={`text-[12.5px] font-medium ${sub(scope === "moi")}`}>Mes tâches</span>
          <span className="text-[22px] font-extrabold leading-tight">{stats.mine}</span>
          <span
            className={`text-[12px] ${scope === "moi" ? "text-white/80" : stats.mineUrgent ? "font-semibold text-amber-700 dark:text-amber-300" : "text-muted"}`}
          >
            {stats.mineUrgent ? `${stats.mineUrgent} pour aujourd’hui ou en retard` : "Rien d’urgent pour vous"}
          </span>
        </button>
        <button type="button" aria-pressed={lateOnly} onClick={() => setLateOnly((v) => !v)} className={tile(lateOnly)}>
          <span className={`text-[12.5px] font-medium ${sub(lateOnly)}`}>En retard</span>
          <span className={`text-[22px] font-extrabold leading-tight ${!lateOnly && stats.late ? "text-red-600 dark:text-red-400" : ""}`}>
            {stats.late}
          </span>
          <span className={`text-[12px] ${sub(lateOnly)}`}>Échéance dépassée</span>
        </button>
        <button
          type="button"
          aria-pressed={scope === "libres"}
          onClick={() => setScope(scope === "libres" ? "tous" : "libres")}
          className={tile(scope === "libres")}
        >
          <span className={`text-[12.5px] font-medium ${sub(scope === "libres")}`}>À prendre</span>
          <span className="text-[22px] font-extrabold leading-tight">{stats.free}</span>
          <span className={`text-[12px] ${sub(scope === "libres")}`}>Personne n’est assigné</span>
        </button>
        <div className="grid gap-0.5 rounded-xl bg-[linear-gradient(180deg,#d6a94e,#b08431)] px-4 py-3 text-brand-deep">
          <span className="text-[12.5px] font-medium opacity-85">Cette semaine</span>
          <span className="text-[22px] font-extrabold leading-tight">
            {stats.done} <span className="text-[13px] font-semibold opacity-85">terminée{stats.done > 1 ? "s" : ""}</span>
          </span>
          <span className="text-[12px] opacity-85">
            {stats.week} encore prévue{stats.week > 1 ? "s" : ""} d’ici dimanche
          </span>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div role="tablist" aria-label="Affichage" className="flex rounded-xl bg-bg-soft p-1">
          {(
            [
              ["tableau", "Tableau", "M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z"],
              ["calendrier", "Calendrier", "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1"],
            ] as const
          ).map(([v, label, d]) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => switchView(v)}
              className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold ${
                view === v ? "bg-card text-heading shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
                <path d={d} />
              </svg>
              {label}
            </button>
          ))}
        </div>

        <div className="relative order-last basis-full sm:order-none sm:min-w-[200px] sm:flex-1 sm:basis-auto">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            aria-hidden
          >
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une tâche, une mosquée…"
            aria-label="Rechercher une tâche"
            className="h-10 w-full rounded-lg border border-line bg-card pl-9 pr-3 text-[14px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20"
          />
        </div>

        <select
          value={requestFilter}
          onChange={(e) => setRequestFilter(e.target.value)}
          aria-label="Filtrer par demande"
          className={`hidden h-10 max-w-[240px] cursor-pointer rounded-lg border bg-card px-3 text-[14px] outline-none focus:ring-2 focus:ring-brand-text/20 sm:block ${
            requestFilter ? "border-brand-text font-semibold text-brand-text" : "border-line text-fg"
          }`}
        >
          <option value="">Toutes les demandes</option>
          {activeRequests.map((r) => (
            <option key={r.id} value={r.id}>
              n°{r.number} · {r.mosque_name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={newTask}
          className="ml-auto inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover sm:ml-0"
          title="Nouvelle tâche (raccourci : N)"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle tâche
        </button>
      </div>

      {/* Qui fait quoi */}
      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Filtrer par personne">
        {[
          { id: "tous", label: "Toute l’équipe" },
          { id: "moi", label: "Moi" },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            aria-pressed={scope === s.id}
            className={`h-8 flex-none cursor-pointer rounded-full border px-3 text-[13px] font-semibold ${
              scope === s.id ? "border-brand bg-brand text-white" : "border-line bg-card text-fg hover:border-brand-text/40"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px flex-none bg-line" />
        {staff
          .filter((p) => p.id !== me)
          .map((p) => {
            const count = tasks.filter((t) => t.assigned_to === p.id && t.status !== "termine").length;
            const on = scope === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setScope(on ? "tous" : p.id)}
                aria-pressed={on}
                className={`flex h-8 flex-none cursor-pointer items-center gap-1.5 rounded-full border pl-1 pr-3 text-[13px] font-semibold ${
                  on ? "border-brand bg-brand text-white" : "border-line bg-card text-fg hover:border-brand-text/40"
                }`}
              >
                <Avatar person={p} />
                {personName(p).split(" ")[0]}
                <span className={`text-[12px] font-medium ${on ? "text-white/80" : "text-muted"}`}>{count}</span>
              </button>
            );
          })}
        {filtersOn && (
          <button
            type="button"
            onClick={() => {
              setScope("tous");
              setRequestFilter("");
              setLateOnly(false);
              setQuery("");
            }}
            className="ml-1 flex-none cursor-pointer whitespace-nowrap text-[13px] font-semibold text-brand-text underline underline-offset-2"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {view === "tableau" ? (
        <Board
          columns={columns}
          lookup={lookup}
          selectedId={openId}
          onOpen={open}
          onToggle={toggle}
          onMove={move}
          onQuickAdd={(title, status) => quickAdd(title, { status })}
          quickAddRef={quickAddRef}
        />
      ) : (
        <WorkCalendar
          tasks={filtered}
          lookup={lookup}
          selectedId={openId}
          onOpen={open}
          onToggle={toggle}
          onReschedule={reschedule}
          onQuickAdd={(title, day) => quickAdd(title, { due_date: day })}
        />
      )}

      <p className="mt-6 hidden text-center text-[12.5px] text-muted lg:block">
        Astuce : glissez les cartes pour changer leur statut ou leur date ·{" "}
        <kbd className="rounded border border-line px-1">N</kbd> pour ajouter une tâche
      </p>

      {openTask && (
        <TaskDrawer
          key={openTask.id}
          task={openTask}
          lookup={lookup}
          staff={staff}
          requests={requests}
          autoFocusTitle={freshId === openTask.id}
          onUpdate={(patch) => update(openTask.id, patch)}
          onDelete={() => {
            remove(openTask);
            open(null);
          }}
          onClose={() => open(null)}
          onCommentCount={(d) => bumpComments(openTask.id, d)}
        />
      )}
      <ToastBar toast={toast} onClose={() => notify(null)} />
    </>
  );
}
