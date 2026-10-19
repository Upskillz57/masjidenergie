// Documents utiles et formulaires en ligne : définitions partagées serveur / navigateur.

export const DOC_CATEGORIES = {
  general: "Général",
  formulaire: "Formulaires à remplir",
  contrat: "Contrats",
  technique: "Documents techniques",
  communication: "Communication",
} as const;
export type DocCategory = keyof typeof DOC_CATEGORIES;
export const isDocCategory = (v: unknown): v is DocCategory => typeof v === "string" && v in DOC_CATEGORIES;

export const FORM_KINDS = { linky: "Autorisation d’accès aux données Linky (Enedis)" } as const;
export type FormKind = keyof typeof FORM_KINDS;

export type LibraryDocument = {
  id: string;
  title: string;
  description: string | null;
  category: DocCategory;
  file_name: string;
  mime: string | null;
  size: number;
  visible_to_mosques: boolean;
  form_kind: FormKind | null;
  updated_at: string;
};

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

/** Réponses du formulaire Linky (partie B « client professionnel ou autre » + compteur + signature). */
export type LinkyData = {
  denomination: string;
  legalForm: string;
  tradeName: string;
  siret: string;
  naf: string;
  address: string;
  postalCode: string;
  city: string;
  signerCivility: "M" | "Mme";
  signerLastName: string;
  signerFirstName: string;
  contractHolder: string;
  phone: string;
  email: string;
  prm: string;
  siteAddress: string;
  place: string;
};

export type LinkyErrors = Partial<Record<keyof LinkyData | "signature" | "consent", string>>;

/** Contrôle des réponses ; renvoie les messages d'erreur par champ. */
export function validateLinky(d: LinkyData) {
  const errors: LinkyErrors = {};
  if (!d.denomination) errors.denomination = "Nom de l’association requis.";
  if (!d.tradeName) errors.tradeName = "Nom de la mosquée requis.";
  if (!/^\d{14}$/.test(d.siret)) errors.siret = "Le SIRET compte 14 chiffres.";
  if (d.naf && !/^\d{4}[A-Z]$/.test(d.naf)) errors.naf = "Format attendu : 4 chiffres et 1 lettre (ex. 9491Z).";
  if (!d.address) errors.address = "Adresse requise.";
  if (!/^\d{5}$/.test(d.postalCode)) errors.postalCode = "Code postal à 5 chiffres.";
  if (!d.city) errors.city = "Commune requise.";
  if (!d.signerLastName) errors.signerLastName = "Nom du signataire requis.";
  if (!d.signerFirstName) errors.signerFirstName = "Prénom du signataire requis.";
  if (d.prm && !/^\d{14}$/.test(d.prm)) errors.prm = "Le numéro PRM compte 14 chiffres (sur la facture ou le compteur).";
  if (!d.prm && !d.siteAddress) errors.prm = "Indiquez le numéro PRM ou l’adresse du compteur.";
  if (!d.place) errors.place = "Lieu de signature requis.";
  return errors;
}
