// Pièces du dossier demandées pour chaque mosquée, partagées entre le formulaire, l'admin et l'espace mosquée.

export const REQUIRED_BILLS = 12;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const FILE_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic";

export const FILE_KINDS = ["facture", "enedis", "toiture", "document"] as const;
export type FileKind = (typeof FILE_KINDS)[number];
export const isFileKind = (k: unknown): k is FileKind =>
  typeof k === "string" && (FILE_KINDS as readonly string[]).includes(k);

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  facture: "Facture",
  enedis: "Autorisation Enedis",
  toiture: "Vue aérienne",
  document: "Document",
};

export const MAX_FILES: Record<FileKind, number> = { facture: 24, enedis: 3, toiture: 5, document: 10 };

export const MOTIVATIONS = {
  economie: "Économie rapide",
  hausse: "Anticiper une hausse du prix de l’électricité",
  patrimoine: "Valoriser le patrimoine",
  autre: "Autre motivation",
} as const;
export type Motivation = keyof typeof MOTIVATIONS;
export const isMotivation = (m: unknown): m is Motivation => typeof m === "string" && m in MOTIVATIONS;

export type DeclaredFile = { kind: FileKind; name: string; size: number; type: string };
export type SignedUpload = { index: number; path: string; token: string };

export type DossierInput = {
  bills: number;
  enedisFiles: number;
  roofFiles: number;
  linkySigned: boolean;
  motivations: string[];
  context: string | null;
};

export type DossierPiece = {
  key: "enedis" | "factures" | "contexte" | "toiture";
  label: string;
  why: string;
  done: boolean;
  optional?: boolean;
  detail?: string;
};

export function dossierPieces(d: DossierInput): DossierPiece[] {
  return [
    {
      key: "enedis",
      label: "Autorisation Enedis signée et complétée",
      why: "Pour accéder à la consommation réelle de la mosquée.",
      done: d.linkySigned || d.enedisFiles > 0,
    },
    {
      key: "factures",
      label: `Les ${REQUIRED_BILLS} factures d’électricité`,
      why: "Pour connaître le coût exact du kWh sur une année complète.",
      done: d.bills >= REQUIRED_BILLS,
      detail: `${d.bills} / ${REQUIRED_BILLS}`,
    },
    {
      key: "contexte",
      label: "Contexte du projet et motivation",
      why: "Économie rapide, anticipation d’une hausse, valorisation du patrimoine…",
      done: d.motivations.length > 0 || Boolean(d.context),
    },
    {
      key: "toiture",
      label: "Vue aérienne claire de la toiture",
      why: "Pour repérer la surface à exploiter.",
      done: d.roofFiles > 0,
      optional: true,
    },
  ];
}

export const missingPieces = (pieces: DossierPiece[]) => pieces.filter((p) => !p.done && !p.optional);
