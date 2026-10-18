// Workspace / organisation settings (no backend model — UI-level config)
export const workspaceSettings = {
  name: 'Arista Healthcare Staffing',
  website: 'https://arista.com',
  description:
    'Leading healthcare staffing agency specialising in nursing and allied health.',
  timezone: 'America/Chicago',
  currency: 'USD',
  // API settings: PATCH /api/v1/shared/settings
  emailSettings: {
    fromEmail: 'hello@arista.com',
    fromName: 'Arista Healthcare Staffing',
  },
  aiSettings: {
    provider: 'claude' as const,
    resumeValidation: true,
    candidateScoring: false,
    resumeParsing: true,
  },
};
