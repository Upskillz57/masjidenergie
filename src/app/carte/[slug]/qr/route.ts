import QRCode from "qrcode";
import { toVCard } from "@/lib/cards";
import { cardUrl, getPublicCard } from "@/lib/cards-data";

// QR code à imprimer : ?type=contact (enregistre la fiche) | lien (ouvre la carte), ?format=svg | png.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getPublicCard(slug);
  if (!card) return new Response("Carte introuvable", { status: 404 });

  const search = new URL(request.url).searchParams;
  const type = search.get("type") === "lien" ? "lien" : "contact";
  const format = search.get("format") === "png" ? "png" : "svg";
  const url = cardUrl(slug);
  const text = type === "lien" ? url : toVCard(card, { cardUrl: url, compact: true });
  const opts = { margin: 2, errorCorrectionLevel: "M" as const, color: { dark: "#0a3d2e", light: "#ffffff" } };
  const filename = `qr-${type}-${slug}.${format}`;
  const headers = {
    "Content-Disposition": `${search.get("dl") ? "attachment" : "inline"}; filename="${filename}"`,
    "Cache-Control": "no-store",
  };

  if (format === "png") {
    const png = await QRCode.toBuffer(text, { ...opts, type: "png", width: 1200 });
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const svg = await QRCode.toString(text, { ...opts, type: "svg" });
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
}
