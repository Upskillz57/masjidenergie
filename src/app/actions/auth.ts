"use server";

import { redirect } from "next/navigation";
import { sendPasswordReset } from "@/lib/admin/invite";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { createAuthClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; message: string } | null;

const notConfigured: FormState = { message: "L’espace en ligne n’est pas encore activé." };

// N'accepte que des chemins internes pour éviter les redirections vers un autre site.
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return /^\/(?![/\\])/.test(s) ? s : null;
};

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return notConfigured;
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { message: "E-mail ou mot de passe incorrect." };

  const user = await getCurrentUser();
  redirect(safeNext(formData.get("next")) ?? homeFor(user?.role ?? "mosquee"));
}

export async function signOut() {
  if (isSupabaseConfigured) await (await createAuthClient()).auth.signOut();
  redirect("/connexion");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return notConfigured;
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: "Adresse e-mail invalide." };
  await sendPasswordReset(email);
  return { ok: true, message: "Si un compte existe pour cette adresse, un lien vient de vous être envoyé." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return notConfigured;
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { message: "8 caractères minimum." };
  if (password !== formData.get("confirm")) return { message: "Les deux mots de passe ne correspondent pas." };

  const user = await getCurrentUser();
  if (!user) return { message: "Lien expiré. Demandez un nouveau lien depuis « Mot de passe oublié »." };
  const { error } = await (await createAuthClient()).auth.updateUser({ password });
  if (error) return { message: "Impossible d’enregistrer ce mot de passe. Choisissez-en un autre." };
  redirect(homeFor(user.role));
}
