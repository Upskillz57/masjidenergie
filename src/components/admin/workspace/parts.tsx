"use client";

import type { DragEvent } from "react";
import {
  avatarTone,
  dueLabel,
  dueState,
  initials,
  personName,
  PRIORITY_META,
  type Person,
  type RequestOption,
  type Task,
} from "@/lib/tasks";

// Briques visuelles partagées : avatar, échéance, carte de tâche.

export type Lookup = {
  people: Map<string, Person>;
  requests: Map<string, RequestOption>;
  today: string;
  me: string;
};

export const DRAG_TYPE = "application/x-masjid-task";
export const startDrag = (e: DragEvent, id: string) => {
  e.dataTransfer.setData(DRAG_TYPE, id);
  e.dataTransfer.setData("text/plain", id);
  e.dataTransfer.effectAllowed = "move";
};
export const draggedId = (e: DragEvent) => e.dataTransfer.getData(DRAG_TYPE) || e.dataTransfer.getData("text/plain");
export const isTaskDrag = (e: DragEvent) => e.dataTransfer.types.includes(DRAG_TYPE);

export function Avatar({ person, size = "sm" }: { person: Person | undefined; size?: "xs" | "sm" | "md" }) {
  const box = size === "xs" ? "size-5 text-[9px]" : size === "md" ? "size-8 text-[12px]" : "size-6 text-[10px]";
  if (!person)
    return (
      <span
        title="Non assignée"
        className={`${box} inline-flex flex-none items-center justify-center rounded-full border border-dashed border-line text-muted`}
      >
        <svg viewBox="0 0 24 24" className="size-3/5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20a7 7 0 0 1 14 0" />
        </svg>
      </span>
    );
  return (
    <span
      title={personName(person)}
      className={`${box} ${avatarTone(person.id)} inline-flex flex-none items-center justify-center rounded-full font-bold text-white`}
    >
      {initials(person)}
    </span>
  );
}

const dueTone = {
  late: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  today: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  soon: "bg-bg-soft text-fg",
  later: "bg-bg-soft text-muted",
  none: "",
};

export function DueChip({ task, today }: { task: Task; today: string }) {
  if (!task.due_date) return null;
  const state = dueState(task, today);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${dueTone[state]}`}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1" />
      </svg>
      {state === "late" && "En retard · "}
      {dueLabel(task.due_date, today)}
      {task.due_time && ` · ${task.due_time.replace(":", "h")}`}
    </span>
  );
}

export function CheckButton({ task, onToggle, size = "md" }: { task: Task; onToggle: () => void; size?: "sm" | "md" }) {
  const done = task.status === "termine";
  const box = size === "sm" ? "size-[18px]" : "size-5";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={done ? `Rouvrir « ${task.title} »` : `Marquer « ${task.title} » comme terminée`}
      title={done ? "Rouvrir" : "Marquer comme terminée"}
      className={`relative z-10 inline-flex ${box} flex-none cursor-pointer items-center justify-center rounded-full border-[1.8px] transition-colors ${
        done
          ? "border-emerald-500 bg-emerald-500 text-white"
          : task.status === "en_cours"
            ? "border-violet-500 text-transparent hover:bg-violet-500/10 hover:text-violet-500"
            : "border-line text-transparent hover:border-emerald-500 hover:text-emerald-500"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </button>
  );
}

export function RequestChip({ request, className = "" }: { request: RequestOption | undefined; className?: string }) {
  if (!request) return null;
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-brand/8 px-1.5 py-0.5 text-[12px] font-semibold text-brand-text ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-3.5 flex-none" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 13h4l1.5 3h5L16 13h4M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" />
      </svg>
      <span className="truncate">{request.mosque_name}</span>
      <span className="flex-none font-medium opacity-70">n°{request.number}</span>
    </span>
  );
}

export function TaskCard({
  task,
  lookup,
  onOpen,
  onToggle,
  selected,
}: {
  task: Task;
  lookup: Lookup;
  onOpen: () => void;
  onToggle: () => void;
  selected?: boolean;
}) {
  const done = task.status === "termine";
  return (
    <article
      draggable
      onDragStart={(e) => startDrag(e, task.id)}
      className={`group relative cursor-grab overflow-hidden rounded-xl border bg-card px-3.5 py-3 shadow-[0_1px_2px_#0000000a] transition-[box-shadow,border-color] hover:border-brand-text/30 hover:shadow-[0_6px_18px_#0000001a] active:cursor-grabbing ${
        selected ? "border-brand-text ring-2 ring-brand-text/20" : "border-line"
      } ${done ? "opacity-70" : ""}`}
    >
      {!done && <span className={`absolute inset-y-0 left-0 w-[3px] ${PRIORITY_META[task.priority].bar}`} aria-hidden />}
      <div className="flex items-start gap-2.5">
        <span className="mt-px">
          <CheckButton task={task} onToggle={onToggle} />
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 cursor-pointer text-left after:absolute after:inset-0"
          aria-label={`Ouvrir « ${task.title} »`}
        >
          <span
            className={`block text-[14px] font-semibold leading-snug text-heading ${done ? "line-through decoration-muted" : ""}`}
          >
            {task.priority === "haute" && !done && <span className="mr-1 text-red-600 dark:text-red-400">!</span>}
            {task.title}
          </span>
        </button>
      </div>
      {(task.request_id || task.due_date || task.comments > 0 || task.assigned_to) && (
        <div className="mt-2.5 flex items-center gap-1.5 pl-[30px]">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <RequestChip request={task.request_id ? lookup.requests.get(task.request_id) : undefined} />
            {!done && <DueChip task={task} today={lookup.today} />}
            {task.comments > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[12px] font-medium text-muted"
                title={`${task.comments} commentaire${task.comments > 1 ? "s" : ""}`}
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12" />
                </svg>
                {task.comments}
              </span>
            )}
          </div>
          {task.assigned_to && <Avatar person={lookup.people.get(task.assigned_to)} />}
        </div>
      )}
    </article>
  );
}
