import { after } from "next/server";
import { toVCard } from "@/lib/cards";
import { cardUrl, getPublicCard } from "@/lib/cards-data";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

// Fiche contact (.vcf) : iPhone l'ouvre dans Contacts, Android dans l'application Contacts.
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getPublicCard(slug);
  if (!card) return new Response("Carte introuvable", { status: 404 });

  if (isSupabaseConfigured) {
    after(async () => {
      await createAdminClient().rpc("increment_card_scans", { card_slug: slug });
    });
  }

  return new Response(toVCard(card, { cardUrl: cardUrl(slug) }), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      // « attachment » : Android ouvre le fichier avec Contacts au lieu de l'afficher en texte ; iPhone affiche la fiche.
      "Content-Disposition": `attachment; filename="${slug}.vcf"; filename*=UTF-8''${encodeURIComponent(card.full_name)}.vcf`,
      "Cache-Control": "no-store",
    },
  });
}
