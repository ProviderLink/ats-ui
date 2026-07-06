import type { EmailDirection, EmailStatus } from './enums';

export interface EmailContext {
  type?: string;
  candidateId?: string | null;
  applicationId?: string | null;
  jobId?: string | null;
  interviewId?: string | null;
}

export interface EmailAttachment {
  filename: string;
  url: string;
  contentType: string;
  size: number;
}

export interface Email {
  _id: string;
  direction: EmailDirection;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  status: EmailStatus;
  threadId?: string;
  inReplyTo?: string;
  templateId?: string | null;
  context?: EmailContext;
  resendId?: string;
  deliveredAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  attachments?: EmailAttachment[];
  sentBy?: string | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendEmailDto {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  templateId?: string;
  context?: EmailContext;
  inReplyTo?: string;
  threadId?: string;
  variables?: Record<string, string>;
  attachments?: EmailAttachment[];
}

export interface EmailFilters {
  candidateId?: string;
  jobId?: string;
  applicationId?: string;
  status?: EmailStatus;
  direction?: EmailDirection;
  threadId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
