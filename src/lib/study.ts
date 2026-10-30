import type { SignedUpload } from "@/lib/dossier";

export const STUDY_HASH = "#etude";
export const DOCUMENTS_BUCKET_NAME = "documents";

export type StudyField = "mosque" | "firstName" | "lastName" | "phone" | "email" | "bills" | "motivation";

export type StudyRequestState = {
  ok: boolean;
  message: string;
  errors?: Partial<Record<StudyField, string>>;
  requestId?: string;
  uploads?: SignedUpload[];
  /** Pièces obligatoires encore à fournir après cet envoi. */
  missing?: string[];
};
