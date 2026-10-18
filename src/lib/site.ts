export const site = {
  name: "Masjid Energie",
  company: "YGB Développement",
  description:
    "Masjid Energie, une solution de YGB Développement, accompagne les mosquées de France dans leur transition énergétique grâce au photovoltaïque.",
  // Adresse publique, sans « . » ni « / » final (liens des e-mails, QR codes, sitemap).
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim().replace(/[./]+$/, ""),
  // URL d'intégration (YouTube /embed/…, Vimeo…). Vide = bouton « Voir notre vidéo » masqué.
  videoUrl: process.env.NEXT_PUBLIC_VIDEO_URL ?? "",
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
