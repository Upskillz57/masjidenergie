import Link from "next/link";
import { CardForm } from "@/components/cards/card-form";
import { Card, Icon, PageHeader } from "@/components/dashboard/ui";
import { requireStaff } from "@/lib/auth";
import { BRAND_META, isCardBrand } from "@/lib/cards";
import { site } from "@/lib/site";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewCardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireStaff("/admin/cartes/nouvelle");
  const raw = (await searchParams).modele;
  const brand = isCardBrand(raw) && raw !== "ygb" ? raw : "masjid";
  const isMe = user.fullName !== user.email;

  return (
    <>
      <Link href="/admin/cartes" className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-text hover:underline">
        <Icon name="back" className="size-4" /> Toutes les cartes
      </Link>
      <PageHeader eyebrow="CARTES DE VISITE" title="Nouvelle carte" description="L’aperçu se met à jour pendant la saisie. Les QR codes sont générés à l’enregistrement." />
      <Card>
        <CardForm
          mode="staff"
          initial={{
            brand,
            full_name: isMe ? user.fullName : "",
            job_title: null,
            organization: BRAND_META[brand].organization,
            phone: null,
            mobile: null,
            email: user.email.endsWith("@exemple.fr") ? null : user.email,
            website: BRAND_META[brand].website || (brand === "masjid" ? site.url : null),
            address: null,
            note: null,
          }}
        />
      </Card>
    </>
  );
}
