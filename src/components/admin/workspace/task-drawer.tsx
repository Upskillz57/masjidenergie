"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { addTaskComment, deleteTaskComment, listTaskComments } from "@/app/actions/tasks";
import {
  addDays,
  personName,
  PRIORITY_META,
  TASK_PRIORITIES,
  TASK_STATUS_META,
  TASK_STATUSES,
  weekStart,
  type Person,
  type RequestOption,
  type Task,
  type TaskComment,
  type TaskPatch,
} from "@/lib/tasks";
import { formatDateTime } from "@/lib/workflow";
import { Avatar, type Lookup } from "./parts";

// Panneau latéral d'une tâche : tout se modifie sur place et s'enregistre aussitôt.

const field = "text-[12px] font-semibold uppercase tracking-[0.06em] text-muted";
const control =
  "h-9 w-full rounded-lg border border-line bg-bg px-2.5 text-[14px] text-fg outline-none focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start sm:gap-3">
      <span className={`${field} sm:pt-2.5`}>{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; dot?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-bg-soft p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => value !== o.value && onChange(o.value)}
          className={`flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-[13px] font-semibold transition-colors ${
            value === o.value ? "bg-card text-heading shadow-sm" : "text-muted hover:text-fg"
          }`}
        >
          {o.dot && <span className={`size-2 rounded-full ${o.dot}`} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TaskDrawer({
  task,
  lookup,
  staff,
  requests,
  onUpdate,
  onDelete,
  onClose,
  onCommentCount,
  autoFocusTitle = false,
}: {
  task: Task;
  lookup: Lookup;
  staff: Person[];
  requests: RequestOption[];
  autoFocusTitle?: boolean;
  onUpdate: (patch: TaskPatch) => void;
  onDelete: () => void;
  onClose: () => void;
  onCommentCount: (delta: number) => void;
}) {
  const { today, me } = lookup;
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const panel = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Les valeurs affichées suivent les changements faits par un collègue (rafraîchissement).
  const [seen, setSeen] = useState(task);
  if (seen !== task) {
    if (seen.title !== task.title) setTitle(task.title);
    if (seen.description !== task.description) setDescription(task.description ?? "");
    setSeen(task);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as HTMLElement).closest("textarea, input, select")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    if (autoFocusTitle) titleRef.current?.select();
    else panel.current?.focus();
    // Uniquement à l'ouverture du panneau.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveTitle = () => {
    const v = title.trim();
    if (!v) return setTitle(task.title);
    if (v !== task.title) onUpdate({ title: v });
  };
  const saveDescription = () => {
    if (description.trim() !== (task.description ?? "")) onUpdate({ description: description.trim() || null });
  };

  const request = task.request_id ? lookup.requests.get(task.request_id) : undefined;
  const creator = task.created_by ? lookup.people.get(task.created_by) : undefined;
  const quickDates = [
    { label: "Aujourd’hui", value: today },
    { label: "Demain", value: addDays(today, 1) },
    { label: "Lundi prochain", value: addDays(weekStart(today), 7) },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 lg:bg-black/15" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Tâche : ${task.title}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-[-12px_0_40px_#00000026] outline-none sm:w-[520px] sm:border-l sm:border-line"
      >
        <header className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${TASK_STATUS_META[task.status].badge}`}
          >
            <span className={`size-1.5 rounded-full ${TASK_STATUS_META[task.status].dot}`} />
            {TASK_STATUS_META[task.status].label}
          </span>
          <span className="flex-1" />
          {task.status !== "termine" ? (
            <button
              type="button"
              onClick={() => onUpdate({ status: "termine" })}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[13px] font-semibold text-white hover:bg-emerald-700"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
              Terminer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUpdate({ status: "a_faire" })}
              className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line px-3 text-[13px] font-semibold text-fg hover:bg-bg-soft"
            >
              Rouvrir
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-bg-soft hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                setTitle(task.title);
                e.currentTarget.blur();
              }
            }}
            rows={1}
            maxLength={200}
            aria-label="Titre de la tâche"
            className="field-sizing-content w-full resize-none rounded-lg bg-transparent px-1 py-1 text-[20px] font-extrabold leading-snug tracking-[-0.01em] text-heading outline-none hover:bg-bg-soft focus:bg-bg-soft"
          />

          <div className="mt-4 grid gap-4">
            <Row label="Statut">
              <Segmented
                label="Statut"
                value={task.status}
                onChange={(status) => onUpdate({ status })}
                options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_META[s].label, dot: TASK_STATUS_META[s].dot }))}
              />
            </Row>

            <Row label="Assignée à">
              <div className="flex items-center gap-2">
                <Avatar person={task.assigned_to ? lookup.people.get(task.assigned_to) : undefined} size="md" />
                <select
                  value={task.assigned_to ?? ""}
                  onChange={(e) => onUpdate({ assigned_to: e.target.value || null })}
                  aria-label="Personne assignée"
                  className={`${control} cursor-pointer`}
                >
                  <option value="">Personne</option>
                  {staff.map((p) => (
                    <option key={p.id} value={p.id}>
                      {personName(p)}
                      {p.id === me ? " (moi)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              {task.assigned_to !== me && (
                <button
                  type="button"
                  onClick={() => onUpdate({ assigned_to: me })}
                  className="mt-1.5 cursor-pointer text-[12.5px] font-semibold text-brand-text hover:underline"
                >
                  Je m’en occupe
                </button>
              )}
            </Row>

            <Row label="Échéance">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={task.due_date ?? ""}
                  onChange={(e) =>
                    onUpdate(e.target.value ? { due_date: e.target.value } : { due_date: null, due_time: null })
                  }
                  aria-label="Date d’échéance"
                  className={`${control.replace("w-full", "")} min-w-0 flex-1`}
                />
                <input
                  type="time"
                  value={task.due_time ?? ""}
                  disabled={!task.due_date}
                  onChange={(e) => onUpdate({ due_time: e.target.value || null })}
                  aria-label="Heure (facultative)"
                  className={`${control.replace("w-full", "")} w-[118px] flex-none disabled:opacity-50`}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {quickDates.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => onUpdate({ due_date: q.value })}
                    className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${
                      task.due_date === q.value ? "border-brand bg-brand text-white" : "border-line text-fg hover:border-brand-text/40"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
                {task.due_date && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ due_date: null, due_time: null })}
                    className="cursor-pointer rounded-full px-2 py-0.5 text-[12px] font-semibold text-muted hover:text-fg"
                  >
                    Retirer la date
                  </button>
                )}
              </div>
            </Row>

            <Row label="Priorité">
              <Segmented
                label="Priorité"
                value={task.priority}
                onChange={(priority) => onUpdate({ priority })}
                options={TASK_PRIORITIES.map((p) => ({
                  value: p,
                  label: PRIORITY_META[p].label,
                  dot: p === "haute" ? "bg-red-500" : undefined,
                }))}
              />
            </Row>

            <Row label="Demande">
              <select
                value={task.request_id ?? ""}
                onChange={(e) => onUpdate({ request_id: e.target.value || null })}
                aria-label="Demande d’étude liée"
                className={`${control} cursor-pointer`}
              >
                <option value="">Aucune (tâche générale)</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    n°{r.number} · {r.mosque_name}
                  </option>
                ))}
              </select>
              {request && (
                <Link
                  href={`/admin/demandes/${request.id}`}
                  className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-text hover:underline"
                >
                  Ouvrir la demande n°{request.number}
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              )}
            </Row>

            <div className="grid gap-1.5">
              <span className={field}>Notes</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
                rows={3}
                maxLength={5000}
                placeholder="Détails, étapes, contacts utiles…"
                aria-label="Notes"
                className="field-sizing-content min-h-[84px] w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-[14px] leading-relaxed text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20"
              />
            </div>
          </div>

          <Comments key={task.id} taskId={task.id} me={me} onCount={onCommentCount} />

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[12.5px] text-muted">
            <span>
              Créée {creator ? `par ${personName(creator)} ` : ""}le {formatDateTime(task.created_at)}
              {task.completed_at && task.status === "termine" && <> · terminée le {formatDateTime(task.completed_at)}</>}
            </span>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-red-600 hover:underline dark:text-red-400"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
              </svg>
              Supprimer
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

function Comments({ taskId, me, onCount }: { taskId: string; me: string; onCount: (delta: number) => void }) {
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let live = true;
    listTaskComments(taskId).then(
      (c) => live && setComments(c),
      () => live && setComments([]),
    );
    return () => {
      live = false;
    };
  }, [taskId]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const c = await addTaskComment(taskId, text).catch(() => null);
    setSending(false);
    if (!c) return;
    setComments((list) => [...(list ?? []), c]);
    setBody("");
    onCount(1);
  };

  return (
    <section className="mt-7">
      <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-heading">
        Échanges
        {comments && comments.length > 0 && <span className="text-[12.5px] font-medium text-muted">{comments.length}</span>}
      </h3>
      {comments === null ? (
        <div className="mb-3 h-12 animate-pulse rounded-lg bg-placeholder" />
      ) : (
        <ul className="mb-3 grid gap-3">
          {comments.map((c) => (
            <li key={c.id} className="group rounded-xl bg-bg-soft px-3.5 py-2.5">
              <p className="mb-0.5 flex items-center gap-2 text-[12.5px]">
                <span className="font-semibold text-heading">{c.author}</span>
                <span className="text-muted">{formatDateTime(c.created_at)}</span>
                {c.author_id === me && (
                  <button
                    type="button"
                    onClick={async () => {
                      setComments((list) => (list ?? []).filter((x) => x.id !== c.id));
                      onCount(-1);
                      await deleteTaskComment(c.id).catch(() => null);
                    }}
                    className="ml-auto cursor-pointer text-muted opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                  >
                    Supprimer
                  </button>
                )}
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-fg">{c.body}</p>
            </li>
          ))}
          {comments.length === 0 && (
            <li className="text-[13px] text-muted">
              Aucun échange pour l’instant. Posez une question, partagez un point d’avancement…
            </li>
          )}
        </ul>
      )}
      <div className="rounded-xl border border-line bg-bg focus-within:border-brand-text focus-within:ring-2 focus-within:ring-brand-text/20">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          maxLength={5000}
          placeholder="Écrire un message… (@prénom pour prévenir un collègue)"
          aria-label="Nouveau message"
          className="field-sizing-content block min-h-[60px] w-full resize-none bg-transparent px-3 py-2 text-[14px] text-fg outline-none placeholder:text-muted"
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="hidden text-[11.5px] text-muted sm:inline">⌘ / Ctrl + Entrée pour envoyer</span>
          <button
            type="button"
            onClick={send}
            disabled={!body.trim() || sending}
            className="ml-auto h-8 cursor-pointer rounded-lg bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-hover disabled:cursor-default disabled:opacity-50"
          >
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </section>
  );
}
