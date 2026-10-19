import Link from "next/link";
import { Card, Icon, PageHeader } from "@/components/dashboard/ui";
import { LinkyForm } from "@/components/documents/linky-form";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function LinkyPage() {
  const user = await requireUser("/espace/documents/linky");
  let mosque: { name: string; address: string | null } | null = null;
  if (isSupabaseConfigured && user.mosqueId) {
    const { data } = await createAdminClient().from("mosques").select("name, address").eq("id", user.mosqueId).maybeSingle();
    mosque = data;
  }
  const [firstName, ...rest] = user.fullName.includes("@") ? [""] : user.fullName.split(" ");
  const postal = mosque?.address?.match(/\b(\d{5})\s+(.+)$/);

  return (
    <>
      <Link href="/espace/documents" className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-text hover:underline">
        <Icon name="back" className="size-4" /> Documents
      </Link>
      <PageHeader
        eyebrow="FORMULAIRE EN LIGNE"
        title="Autorisation d’accès aux données Linky"
        description="Remplissez, signez : le formulaire officiel SunLib est généré rempli et signé, et transmis à notre équipe. Vous pourrez le télécharger à tout moment."
      />
      <Card>
        <LinkyForm
          defaults={{
            denomination: mosque ? `Association ${mosque.name}` : "",
            legalForm: "Association loi 1901",
            tradeName: mosque?.name ?? "",
            naf: "9491Z",
            address: mosque?.address?.replace(/,?\s*\d{5}\s+.+$/, "") ?? "",
            postalCode: postal?.[1] ?? "",
            city: postal?.[2] ?? "",
            signerFirstName: firstName,
            signerLastName: rest.join(" "),
            email: user.email,
            place: postal?.[2] ?? "",
          }}
        />
      </Card>
    </>
  );
}
