import { BRAND_META, cardIcon, cardPath } from "@/lib/cards";
import { getPublicCard } from "@/lib/cards-data";

// Manifeste propre à chaque carte : « Ajouter à l'écran d'accueil » ouvre directement cette carte.
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getPublicCard(slug);
  if (!card) return new Response("Carte introuvable", { status: 404 });
  const path = cardPath(slug);
  const color = BRAND_META[card.brand].themeColor;
  return Response.json(
    {
      id: path,
      name: `${card.full_name} · ${card.organization}`,
      short_name: card.full_name.slice(0, 24),
      description: "Carte de visite numérique",
      start_url: path,
      scope: path,
      display: "standalone",
      background_color: color,
      theme_color: color,
      lang: "fr",
      icons: [
        { src: cardIcon(card.brand, 192), sizes: "192x192", type: "image/png", purpose: "any" },
        { src: cardIcon(card.brand, 512), sizes: "512x512", type: "image/png", purpose: "any" },
        { src: cardIcon(card.brand, 512), sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
