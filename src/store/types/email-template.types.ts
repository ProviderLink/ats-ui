import type { EmailTemplateType } from './enums';

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  type: EmailTemplateType;
  variables?: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateDto {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  type: EmailTemplateType;
  variables?: string[];
  isDefault?: boolean;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  type?: EmailTemplateType;
  variables?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}
