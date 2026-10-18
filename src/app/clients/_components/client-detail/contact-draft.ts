export type ContactDraft = {
  name: string;
  email: string;
  phone: string;
  position: string;
  isPrimary: boolean;
};

export const emptyDraft = (): ContactDraft => ({
  name: '',
  email: '',
  phone: '',
  position: '',
  isPrimary: false,
});

/** Strip empty strings so optional fields are truly undefined for the API. */
export function sanitizeDraft(d: ContactDraft): {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  isPrimary?: boolean;
} {
  return {
    name: d.name,
    email: d.email,
    ...(d.phone.trim() ? { phone: d.phone } : {}),
    ...(d.position.trim() ? { position: d.position } : {}),
    isPrimary: d.isPrimary,
  };
}
