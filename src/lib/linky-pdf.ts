import "server-only";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { LinkyData } from "@/lib/documents";

// Remplit le formulaire SunLib « Autorisation de communication des données de mesure » (PDF d'origine, A4).
// Coordonnées relevées sur le document (origine en bas à gauche, en points).

const CELL = 9.58; // largeur d'une case |_| du formulaire

export async function fillLinkyPdf(template: Uint8Array, d: LinkyData, signaturePng: Uint8Array, signedAt: Date) {
  const pdf = await PDFDocument.load(template);
  const page = pdf.getPage(0);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.05, 0.16, 0.42);

  // Helvetica standard (WinAnsi) : on retire les caractères hors jeu pour éviter une erreur d'encodage.
  const safe = (s: string) => s.normalize("NFC").replace(/[^\x20-\x7E -ÿ’œŒ€]/g, "").replace(/’/g, "'");
  const text = (s: string, x: number, y: number, size = 9, maxWidth = 0) => {
    const v = safe(s);
    let sz = size;
    while (maxWidth && sz > 6 && font.widthOfTextAtSize(v, sz) > maxWidth) sz -= 0.5;
    page.drawText(v, { x, y, size: sz, font, color: ink });
  };
  const cells = (s: string, x0: number, y: number) =>
    [...s].forEach((c, i) => {
      const cx = x0 + CELL * i + 2.9;
      page.drawText(c, { x: cx - font.widthOfTextAtSize(c, 9) / 2, y, size: 9, font, color: ink });
    });
  const cross = (x: number, y: number) => page.drawText("X", { x: x + 1.3, y: y + 0.3, size: 9, font: bold, color: ink });

  cross(564.7, 582.3); // Association, copropriété…
  text(d.denomination, 136, 569.6, 9, 200);
  text(d.legalForm, 459, 569.6, 8.5, 108);
  text(d.tradeName, 118, 555.5, 9, 440);
  cells(d.siret, 145.6 + 9.5, 541.5);
  if (d.naf) {
    cells(d.naf.slice(0, 4), 433.3 + 9.6, 541.5);
    cells(d.naf.slice(4, 5), 490.3 + 4.7, 541.5);
  }
  text(d.address, 80, 527.4, 9, 480);
  cells(d.postalCode, 89.2 + 9.4, 513.4);
  text(d.city, 232, 513.4, 9, 330);
  cross(d.signerCivility === "Mme" ? 98.1 : 47.3, 484.0);
  text(d.signerLastName.toUpperCase(), 160, 485.3, 9, 195);
  text(d.signerFirstName, 420, 485.3, 9, 148);
  text(d.contractHolder || d.denomination, 162, 471.3, 9, 405);
  text(d.phone, 97, 457.2, 9, 145);
  text(d.email, 294, 457.2, 9, 270);
  text(d.prm ? `PRM ${d.prm}${d.siteAddress ? ` - ${d.siteAddress}` : ""}` : d.siteAddress, 178, 401.2, 9, 285);

  // Date et lieu, à l'heure de Paris (les serveurs tournent en UTC).
  const part = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", ...o }).format(signedAt);
  const dd = part({ day: "2-digit" });
  const mm = part({ month: "2-digit" });
  const yyyy = part({ year: "numeric" });
  const hhmm = part({ hour: "2-digit", minute: "2-digit" });
  text(d.place, 60, 184.6, 9, 160);
  page.drawRectangle({ x: 47, y: 171, width: 60, height: 10, color: rgb(1, 1, 1) });
  text(`${dd} / ${mm} / ${yyyy}`, 50, 173.4);

  // Signature dessinée, centrée dans le cadre « Signature du Client ».
  const sig = await pdf.embedPng(signaturePng);
  const box = { x: 352, y: 124, w: 214, h: 62 };
  const scale = Math.min(box.w / sig.width, box.h / sig.height);
  page.drawImage(sig, {
    x: box.x + (box.w - sig.width * scale) / 2,
    y: box.y + (box.h - sig.height * scale) / 2,
    width: sig.width * scale,
    height: sig.height * scale,
  });
  const stamp = `Signé en ligne par ${d.signerFirstName} ${d.signerLastName.toUpperCase()} le ${dd}/${mm}/${yyyy} à ${hhmm}`;
  text(stamp, 352, 116, 6.5, 214);

  pdf.setTitle(`Autorisation Linky - ${safe(d.tradeName)}`);
  return pdf.save();
}
