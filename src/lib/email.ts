import "server-only";

import { site } from "@/lib/site";

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const teamInbox = () => (process.env.STUDY_REQUEST_TO ?? site.contact.email).split(",").map((s) => s.trim());

// Couleurs et police du site. Les e-mails n'acceptent que des styles en ligne et des tableaux
// (Outlook, Gmail) : pas de CSS externe, pas de SVG, logo en PNG hébergé sur le site.
const C = {
  green: "#0e5c47",
  deep: "#0a3d2e",
  gold: "#c8a24c",
  cream: "#f3ede2",
  text: "#1d2a26",
  heading: "#13343b",
  muted: "#55605c",
  line: "#ebe9e3",
};
const FONT = "'Figtree','Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Tableau « libellé / valeur » des récapitulatifs (valeurs échappées ici). */
export function emailTable(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;border:1px solid ${C.line};border-radius:10px">${rows
    .map(
      ([k, v], i) =>
        `<tr><td style="padding:11px 14px;width:38%;vertical-align:top;font:600 13px/1.4 ${FONT};color:${C.muted};${i ? `border-top:1px solid ${C.line};` : ""}">${escapeHtml(k)}</td><td style="padding:11px 14px;vertical-align:top;font:400 14px/1.45 ${FONT};color:${C.text};${i ? `border-top:1px solid ${C.line};` : ""}">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("")}</table>`;
}

/**
 * Habillage commun de tous les e-mails : bandeau vert avec le logo, filet or, contenu, bouton, pied de page.
 * `body` est du HTML déjà échappé.
 */
export function emailLayout(
  title: string,
  body: string,
  cta?: { label: string; href: string },
  opts: { eyebrow?: string; preheader?: string } = {},
) {
  const logo = `${site.url}/brand/email/logo-email.png`;
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px"><tr><td style="border-radius:10px;background:${C.gold}"><a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 26px;font:700 15px/1 ${FONT};color:${C.deep};text-decoration:none;border-radius:10px">${escapeHtml(cta.label)} &rarr;</a></td></tr></table>`
    : "";
  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 8px;font:700 11.5px/1 ${FONT};letter-spacing:.22em;text-transform:uppercase;color:${C.gold}">${escapeHtml(opts.eyebrow)}</p>`
    : "";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(10,61,46,.08)">
<tr><td style="background:${C.deep};background-image:linear-gradient(160deg,${C.green} 0%,${C.deep} 75%);padding:26px 32px">
<a href="${site.url}" style="text-decoration:none"><img src="${logo}" width="240" height="54" alt="${escapeHtml(site.name)}" style="display:block;border:0;width:240px;height:auto;color:#ffffff;font:700 22px ${FONT}"></a>
</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${C.gold}">&nbsp;</td></tr>
<tr><td style="padding:34px 32px 10px;font:400 15px/1.6 ${FONT};color:${C.text}">
${eyebrow}<h1 style="margin:0 0 18px;font:800 23px/1.25 ${FONT};color:${C.heading}">${escapeHtml(title)}</h1>
${body}${button}
</td></tr>
<tr><td style="padding:22px 32px 28px;border-top:1px solid ${C.line};font:400 12.5px/1.6 ${FONT};color:${C.muted}">
<strong style="color:${C.green}">${escapeHtml(site.name)}</strong> · une solution ${escapeHtml(site.company)}<br>
L’énergie solaire au service des mosquées de France · sans crédit, sans emprunt, sans endettement<br>
<a href="${site.contact.phoneHref}" style="color:${C.muted};text-decoration:none">${escapeHtml(site.contact.phone)}</a> ·
<a href="${site.url}" style="color:${C.green};text-decoration:none">${escapeHtml(site.url.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

type Email = {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
};

/** Envoie via Resend. Sans clé : affiche l'e-mail dans le terminal en développement, échoue en production. */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[e-mail non envoyé, RESEND_API_KEY absent] ${email.subject} → ${email.to.join(", ")}`);
      return true;
    }
    console.error("[e-mail] RESEND_API_KEY manquant");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.STUDY_REQUEST_FROM ?? `${site.name} <onboarding@resend.dev>`,
      to: email.to,
      reply_to: email.replyTo,
      subject: email.subject,
      html: email.html,
      attachments: email.attachments,
    }),
  });
  if (!res.ok) console.error("[e-mail] échec Resend", res.status, await res.text());
  return res.ok;
}
