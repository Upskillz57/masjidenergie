export const STUDY_HASH = "#etude";

export const MAX_BILLS = 5;
export const MAX_BILLS_BYTES = 4 * 1024 * 1024;
export const BILL_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic";

export type StudyField = "mosque" | "firstName" | "lastName" | "phone" | "email" | "bills";

export type StudyRequestState = {
  ok: boolean;
  message: string;
  errors?: Partial<Record<StudyField, string>>;
};
