export interface AppSettings {
  email: {
    fromEmail: string;
    fromName: string;
  };
  ai: {
    provider: 'claude' | 'openai';
    resumeValidation: boolean;
    candidateScoring: boolean;
    resumeParsing: boolean;
  };
  companyTimezone: string;
  applicationConfirmation: {
    enabled: boolean;
    templateId: string | null;
  };
}

export interface UpdateSettingsDto {
  email?: {
    fromEmail?: string;
    fromName?: string;
  };
  ai?: {
    provider?: 'claude' | 'openai';
    resumeValidation?: boolean;
    candidateScoring?: boolean;
    resumeParsing?: boolean;
  };
  companyTimezone?: string;
  applicationConfirmation?: {
    enabled?: boolean;
    templateId?: string | null;
  };
}
