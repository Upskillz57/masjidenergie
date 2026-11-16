"use client";

import { useMemo, useState, type DragEvent } from "react";
import { addDays, compareTasks, longDay, parseDay, TASK_STATUS_META, weekStart, type Task } from "@/lib/tasks";
import { QuickAdd } from "./board";
import { draggedId, isTaskDrag, startDrag, TaskCard, type Lookup } from "./parts";

// Calendrier du mois relié aux tâches : chaque tâche apparaît le jour de son échéance.
// Glisser une tâche sur un jour la replanifie ; la déposer dans « À planifier » retire sa date.

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const monthOf = (iso: string) => `${iso.slice(0, 7)}-01`;
const shiftMonth = (first: string, n: number) => {
  const d = parseDay(first);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

export function WorkCalendar({
  tasks,
  lookup,
  selectedId,
  onOpen,
  onToggle,
  onReschedule,
  onQuickAdd,
}: {
  tasks: Task[];
  lookup: Lookup;
  selectedId: string | null;
  onOpen: (id: string) => void;
  onToggle: (task: Task) => void;
  onReschedule: (id: string, day: string | null) => void;
  onQuickAdd: (title: string, day: string) => void;
}) {
  const { today } = lookup;
  const [month, setMonth] = useState(monthOf(today));
  const [day, setDay] = useState(today);
  const [over, setOver] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) if (t.due_date) map.set(t.due_date, [...(map.get(t.due_date) ?? []), t]);
    for (const list of map.values())
      list.sort((a, b) => Number(a.status === "termine") - Number(b.status === "termine") || compareTasks(a, b, today));
    return map;
  }, [tasks, today]);
  const unscheduled = useMemo(
    () => tasks.filter((t) => !t.due_date && t.status !== "termine").sort((a, b) => compareTasks(a, b, today)),
    [tasks, today],
  );

  const first = weekStart(month);
  const last = addDays(weekStart(addDays(shiftMonth(month, 1), -1)), 6);
  const days: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d);

  const dropProps = (target: string | null) => ({
    onDragOver: (e: DragEvent) => {
      if (!isTaskDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const key = target ?? "none";
      if (over !== key) setOver(key);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(null);
      const id = draggedId(e);
      if (id) onReschedule(id, target);
      if (target) setDay(target);
    },
  });

  const goTo = (iso: string) => {
    setMonth(monthOf(iso));
    setDay(iso);
  };
  const dayTasks = byDay.get(day) ?? [];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_4px_14px_#0000000a]">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="mr-auto text-[17px] font-extrabold capitalize text-heading">{monthFmt.format(parseDay(month))}</h2>
          <button
            type="button"
            onClick={() => goTo(today)}
            className="h-8 cursor-pointer rounded-lg border border-line px-3 text-[13px] font-semibold text-fg hover:bg-bg-soft"
          >
            Aujourd’hui
          </button>
          <div className="flex">
            {[-1, 1].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMonth(shiftMonth(month, n))}
                aria-label={n < 0 ? "Mois précédent" : "Mois suivant"}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg hover:bg-bg-soft"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d={n < 0 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
                </svg>
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-7 border-b border-line bg-bg-soft text-center text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-2">
              {w}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const list = byDay.get(d) ?? [];
            const inMonth = d.slice(0, 7) === month.slice(0, 7);
            const isToday = d === today;
            const isSelected = d === day;
            const weekend = i % 7 >= 5;
            const late = list.some((t) => t.status !== "termine" && d < today);
            return (
              <div
                key={d}
                {...dropProps(d)}
                onClick={() => setDay(d)}
                className={`relative flex min-h-[64px] cursor-pointer flex-col gap-1 border-b border-r border-line p-1 transition-colors sm:min-h-[112px] sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${
                  over === d ? "bg-brand/10" : isSelected ? "bg-brand/[0.05]" : weekend ? "bg-bg-soft/60" : "hover:bg-bg-soft/60"
                }`}
              >
                <span className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDay(d);
                    }}
                    aria-label={`${longDay(d)}${list.length ? `, ${list.length} tâche${list.length > 1 ? "s" : ""}` : ""}`}
                    aria-pressed={isSelected}
                    className={`flex size-7 cursor-pointer items-center justify-center rounded-full text-[13px] font-semibold ${
                      isToday
                        ? "bg-brand text-white"
                        : isSelected
                          ? "text-heading ring-2 ring-brand-text"
                          : inMonth
                            ? "text-heading"
                            : "text-muted/60"
                    }`}
                  >
                    {Number(d.slice(8))}
                  </button>
                  {late && <span className="size-1.5 rounded-full bg-red-500 sm:hidden" />}
                </span>

                {/* Mobile : pastilles ; écran large : titres des tâches */}
                <span className="flex flex-wrap gap-0.5 px-1 sm:hidden">
                  {list.slice(0, 4).map((t) => (
                    <span key={t.id} className={`size-1.5 rounded-full ${TASK_STATUS_META[t.status].dot}`} />
                  ))}
                </span>
                <span className="hidden min-w-0 gap-1 sm:grid">
                  {list.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      draggable
                      onDragStart={(e) => startDrag(e, t.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDay(d);
                        onOpen(t.id);
                      }}
                      title={t.title}
                      className={`flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-[3px] text-left text-[12px] font-medium leading-tight ${
                        t.status === "termine"
                          ? "text-muted line-through"
                          : d < today
                            ? "bg-red-50 text-red-800 dark:bg-red-400/10 dark:text-red-200"
                            : "bg-bg-soft text-fg hover:bg-brand/10"
                      } ${t.id === selectedId ? "ring-1 ring-brand-text" : ""}`}
                    >
                      <span className={`size-1.5 flex-none rounded-full ${TASK_STATUS_META[t.status].dot}`} />
                      {t.due_time && <span className="flex-none font-semibold opacity-70">{t.due_time.replace(":", "h")}</span>}
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                  {list.length > 3 && (
                    <span className="px-1.5 text-[11.5px] font-semibold text-muted">
                      + {list.length - 3} autre{list.length > 4 ? "s" : ""}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="grid gap-5 xl:sticky xl:top-6">
        <section
          {...dropProps(day)}
          className={`rounded-2xl border bg-card p-4 shadow-[0_4px_14px_#0000000a] ${over === day ? "border-brand-text/50" : "border-line"}`}
        >
          <header className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-bold text-heading">{day === today ? "Aujourd’hui" : longDay(day)}</h3>
            <span className="text-[12.5px] text-muted">
              {dayTasks.length} tâche{dayTasks.length > 1 ? "s" : ""}
            </span>
          </header>
          <QuickAdd placeholder="Ajouter une tâche ce jour…" onAdd={(title) => onQuickAdd(title, day)} />
          <div className="grid gap-2">
            {dayTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                lookup={lookup}
                selected={t.id === selectedId}
                onOpen={() => onOpen(t.id)}
                onToggle={() => onToggle(t)}
              />
            ))}
            {dayTasks.length === 0 && <p className="py-3 text-center text-[13px] text-muted">Rien de prévu ce jour-là.</p>}
          </div>
        </section>

        <section
          {...dropProps(null)}
          className={`rounded-2xl border border-dashed p-4 ${
            over === "none" ? "border-brand-text bg-brand/6" : "border-line bg-bg-tint/50 dark:bg-white/[0.03]"
          }`}
        >
          <header className="mb-1 flex items-baseline justify-between">
            <h3 className="text-[15px] font-bold text-heading">À planifier</h3>
            <span className="text-[12.5px] text-muted">{unscheduled.length}</span>
          </header>
          <p className="mb-3 text-[12.5px] text-muted">
            <span className="hidden sm:inline">Glissez une tâche sur un jour du calendrier pour lui donner une date.</span>
            <span className="sm:hidden">Ouvrez une tâche pour lui donner une date.</span>
          </p>
          <div className="grid max-h-[420px] gap-2 overflow-y-auto">
            {unscheduled.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                lookup={lookup}
                selected={t.id === selectedId}
                onOpen={() => onOpen(t.id)}
                onToggle={() => onToggle(t)}
              />
            ))}
            {unscheduled.length === 0 && (
              <p className="py-2 text-center text-[13px] text-muted">Toutes les tâches ont une date.</p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
