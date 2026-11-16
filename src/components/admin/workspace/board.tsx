"use client";

import { useState, type RefObject } from "react";
import { TASK_STATUS_META, TASK_STATUSES, type Task, type TaskStatus } from "@/lib/tasks";
import { draggedId, isTaskDrag, TaskCard, type Lookup } from "./parts";

// Tableau en trois colonnes : À faire, En cours, Terminé.
// Glisser une carte d'une colonne à l'autre change son statut ; sur mobile, une colonne à la fois.

const DONE_PAGE = 8;

export function Board({
  columns,
  lookup,
  selectedId,
  onOpen,
  onToggle,
  onMove,
  onQuickAdd,
  quickAddRef,
}: {
  columns: Record<TaskStatus, Task[]>;
  lookup: Lookup;
  selectedId: string | null;
  onOpen: (id: string) => void;
  onToggle: (task: Task) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onQuickAdd: (title: string, status: TaskStatus) => void;
  quickAddRef: RefObject<HTMLInputElement | null>;
}) {
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>("a_faire");
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [doneShown, setDoneShown] = useState(DONE_PAGE);

  return (
    <>
      <div role="tablist" aria-label="Colonnes" className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-bg-soft p-1 md:hidden">
        {TASK_STATUSES.map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={mobileColumn === s}
            onClick={() => setMobileColumn(s)}
            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold ${
              mobileColumn === s ? "bg-card text-heading shadow-sm" : "text-muted"
            }`}
          >
            <span className={`size-2 rounded-full ${TASK_STATUS_META[s].dot}`} />
            {TASK_STATUS_META[s].label}
            <span className="text-[12px] font-medium text-muted">{columns[s].length}</span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => {
          const list = columns[status];
          const visible = status === "termine" ? list.slice(0, doneShown) : list;
          return (
            <section
              key={status}
              aria-label={TASK_STATUS_META[status].label}
              onDragOver={(e) => {
                if (!isTaskDrag(e)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (over !== status) setOver(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = draggedId(e);
                if (id) onMove(id, status);
              }}
              className={`min-h-[200px] rounded-2xl border p-2.5 transition-colors ${
                over === status ? "border-brand-text/50 bg-brand/6" : "border-transparent bg-bg-tint/60 dark:bg-white/[0.03]"
              } ${mobileColumn === status ? "" : "hidden md:block"}`}
            >
              <header className="mb-2.5 hidden items-center gap-2 px-1.5 pt-1 md:flex">
                <span className={`size-2.5 rounded-full ${TASK_STATUS_META[status].dot}`} />
                <h2 className="text-[14px] font-bold text-heading">{TASK_STATUS_META[status].label}</h2>
                <span className="rounded-full bg-card px-2 py-0.5 text-[12px] font-semibold text-muted">{list.length}</span>
              </header>

              {status !== "termine" && (
                <QuickAdd
                  inputRef={status === "a_faire" ? quickAddRef : undefined}
                  placeholder={status === "a_faire" ? "Ajouter une tâche…" : "Ajouter une tâche en cours…"}
                  onAdd={(title) => onQuickAdd(title, status)}
                />
              )}

              <div className="grid gap-2">
                {visible.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    lookup={lookup}
                    selected={t.id === selectedId}
                    onOpen={() => onOpen(t.id)}
                    onToggle={() => onToggle(t)}
                  />
                ))}
                {list.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
                    {TASK_STATUS_META[status].empty}
                  </p>
                )}
                {status === "termine" && list.length > doneShown && (
                  <button
                    type="button"
                    onClick={() => setDoneShown((n) => n + DONE_PAGE * 2)}
                    className="cursor-pointer rounded-lg py-2 text-[13px] font-semibold text-brand-text hover:bg-card"
                  >
                    Afficher {Math.min(DONE_PAGE * 2, list.length - doneShown)} de plus
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

/** Champ d'ajout rapide : Entrée pour créer, le champ reste prêt pour la suivante. */
export function QuickAdd({
  onAdd,
  placeholder,
  inputRef,
}: {
  onAdd: (title: string) => void;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="mb-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        const title = value.trim();
        if (!title) return;
        onAdd(title);
        setValue("");
      }}
    >
      <label className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-line bg-card/70 px-3 text-muted focus-within:border-solid focus-within:border-brand-text focus-within:bg-card focus-within:ring-2 focus-within:ring-brand-text/15">
        <svg viewBox="0 0 24 24" className="size-4 flex-none" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setValue("");
              e.currentTarget.blur();
            }
          }}
          maxLength={200}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-muted"
        />
        {value.trim() && <kbd className="rounded border border-line px-1.5 text-[11px] font-semibold text-muted">Entrée</kbd>}
      </label>
    </form>
  );
}
