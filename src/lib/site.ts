export type TeamContact = { name: string; role: string; phone?: string; whatsapp?: string };

// Contacts de la section « Contact » : numéros au format français (06…, 07…).
const team: TeamContact[] = [
  { name: "Frère Aboubacar", role: "Responsable développement", phone: "06 01 86 95 63", whatsapp: "06 01 86 95 63" },
  { name: "Frère Giovanni", role: "Responsable développement", whatsapp: "07 88 18 80 00" },
  { name: "Frère Yacine", role: "Responsable développement", phone: "07 69 02 29 82", whatsapp: "06 21 12 39 74" },
  { name: "Frère Brahim", role: "Responsable technique", phone: "06 18 85 72 43", whatsapp: "06 18 85 72 43" },
];

/** 06 12 34 56 78 → +33612345678 (liens tel: et WhatsApp). */
const international = (n: string) => `+33${n.replace(/\D/g, "").replace(/^0/, "")}`;
export const telLink = (n: string) => `tel:${international(n)}`;
export const whatsappLink = (n: string) => `https://wa.me/${international(n).slice(1)}`;

export const site = {
  team,
  name: "Masjid Energie",
  description:
    "Masjid Energie accompagne les mosquées de France dans leur transition énergétique grâce au photovoltaïque.",
  // Adresse publique, sans « . » ni « / » final (liens des e-mails, QR codes, sitemap).
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim().replace(/[./]+$/, ""),
  contact: {
    person: "Aboubacar Barry",
    phone: "+33 6 01 86 95 63",
    phoneHref: "tel:+33601869563",
    email: "contact@masjid-energie.fr",
  },
  nav: [
    { label: "Accueil", href: "/#accueil", section: "accueil" },
    { label: "Notre solution", href: "/#accompagnement", section: "accompagnement" },
    { label: "Pourquoi nous", href: "/#pourquoi", section: "pourquoi" },
    { label: "Nos réalisations", href: "/#realisations", section: "realisations" },
    { label: "Partenaires", href: "/#partenaires", section: "partenaires" },
    { label: "À propos", href: "/#a-propos", section: "a-propos" },
    { label: "Contact", href: "/#contact", section: "contact" },
  ],
} as const;
