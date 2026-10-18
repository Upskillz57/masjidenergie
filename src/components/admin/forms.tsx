"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { approveAccountRequest, inviteTeamMember, type ActionState } from "@/app/actions/admin";

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

/** Bouton de suppression avec confirmation. */
export function ConfirmButton({ message, children, className }: { message: string; children: ReactNode; className: string }) {
  return (
    <button
      type="submit"
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
