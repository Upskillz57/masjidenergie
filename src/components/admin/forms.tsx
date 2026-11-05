"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  approveAccountRequest,
  inviteRequesterToCreateAccount,
  inviteTeamMember,
  updateRequestStatus,
  type ActionState,
} from "@/app/actions/admin";
import { REQUEST_STATUSES, STATUS_META, type RequestStatus } from "@/lib/workflow";

const button =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-hover disabled:cursor-default disabled:opacity-60";
const input =
  "h-10 w-full rounded-lg border border-line bg-bg px-3 text-[14px] text-fg outline-none placeholder:text-muted focus:border-brand-text focus:ring-2 focus:ring-brand-text/20";

export function SubmitButton({
  children,
  pendingLabel,
  className = button,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Enregistrement…") : children}
    </button>
  );
}

/** Liste déroulante qui enregistre dès qu'on change la valeur. */
export function AutoSubmitSelect({
  name,
  defaultValue,
  label,
  children,
}: {
  name: string;
  defaultValue: string;
  label: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={label}
      disabled={pending}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={`${input} cursor-pointer disabled:opacity-60`}
    >
      {children}
    </select>
  );
}

/** Statut modifiable directement depuis la liste des demandes : pastille colorée qui enregistre au changement. */
export function StatusSelect({ id, status }: { id: string; status: RequestStatus }) {
  return (
    <form action={updateRequestStatus} className="relative z-10 inline-flex">
      <input type="hidden" name="id" value={id} />
      <StatusSelectField status={status} />
    </form>
  );
}

function StatusSelectField({ status }: { status: RequestStatus }) {
  const { pending } = useFormStatus();
  const [value, setValue] = useState(status);
  return (
    <span className="relative inline-flex">
      <select
        name="status"
        value={value}
        aria-label="Changer le statut"
        disabled={pending}
        onChange={(e) => {
          setValue(e.currentTarget.value as RequestStatus);
          e.currentTarget.form?.requestSubmit();
        }}
        className={`h-7 cursor-pointer appearance-none rounded-full border-0 py-0 pl-2.5 pr-7 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand-text/40 disabled:opacity-60 ${STATUS_META[value].badge}`}
      >
        {REQUEST_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-card text-fg">
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 opacity-70"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

/** Bouton de suppression avec confirmation. */
export function ConfirmButton({
  message,
  children,
  className,
  label,
}: {
  message: string;
  children: ReactNode;
  className: string;
  label?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-[13px] font-medium ${state.ok ? "text-brand-text" : "text-red-600 dark:text-red-400"}`}>
      {state.message}
    </p>
  );
}

export function ApproveAccountForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(approveAccountRequest, null);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Création du compte…" : "Valider et créer le compte"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteTeamMember, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_200px_auto] sm:items-end">
      <label className="grid gap-1.5 text-[13px] font-semibold text-fg">
        Nom complet
        <input name="fullName" required className={input} placeholder="Prénom Nom" />
      </label>
      <label className="grid gap-1.5 text-[13px] font-semibold text-fg">
        E-mail
        <input name="email" type="email" required className={input} placeholder="prenom@masjidenergie.fr" />
      </label>
      <label className="grid gap-1.5 text-[13px] font-semibold text-fg">
        Rôle
        <select name="role" defaultValue="equipe" className={`${input} cursor-pointer`}>
          <option value="equipe">Équipe Masjid Energie</option>
          <option value="technique">Équipe technique</option>
          <option value="admin">Administrateur</option>
        </select>
      </label>
      <button type="submit" disabled={pending} className={button}>
        {pending ? "Envoi…" : "Inviter"}
      </button>
      <div className="sm:col-span-4">
        <Feedback state={state} />
      </div>
    </form>
  );
}

/** Envoie au demandeur l'invitation à créer le compte de sa mosquée. */
export function InviteAccountForm({ id, again }: { id: string; again: boolean }) {
  const [state, action, pending] = useActionState(inviteRequesterToCreateAccount, null);
  return (
    <form action={action} className="grid justify-items-end gap-1.5">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={`${button} h-9 px-3 text-[13.5px]`}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M3 7l9 6 9-6" />
        </svg>
        {pending ? "Envoi…" : again ? "Renvoyer l’invitation" : "Inviter à créer un compte"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

/** Copie un lien dans le presse-papiers. */
export function CopyLinkButton({ value, label = "Copier le lien" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1 font-semibold text-fg hover:bg-bg-soft"
    >
      {copied ? "Lien copié" : label}
    </button>
  );
}
