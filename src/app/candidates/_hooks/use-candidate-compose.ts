import { useEmailTemplateStore } from '@/store/slices/email-templates.store';
import type { Application, Candidate } from '@/store/types';
import { useEffect, useState } from 'react';
import { buildTemplateComposeMode } from '../_utils/build-template-compose-mode';

type EmailFlow = 'approve' | 'reject' | null;

interface ComposeLookups {
  jobs: { _id: string; clientId: string }[];
  getJobTitle: (jobId: string) => string;
  getClientName: (clientId: string) => string;
}

/** Open state and prefill for the email composer launched from the sheet. */
export function useCandidateCompose(
  open: boolean,
  candidate: Candidate | null,
  candidateName: string,
  pendingApplication: Application | null,
  { jobs, getJobTitle, getClientName }: ComposeLookups
) {
  const emailTemplates = useEmailTemplateStore(s => s.items);
  const fetchEmailTemplates = useEmailTemplateStore(s => s.fetch);
  const [composeOpen, setComposeOpen] = useState(false);
  // Which email to compose after the current action completes; drives the
  // template type of the prefill.
  const [pendingEmailFor, setPendingEmailFor] = useState<EmailFlow>(null);
  // Result of a candidate approval, so the email has the new application.
  const [approvedContext, setApprovedContext] = useState<{
    applicationId: string;
    jobId: string;
  } | null>(null);

  // Preload email templates so the composer can offer template choices
  // without an extra round-trip when the user opens it.
  useEffect(() => {
    if (open && emailTemplates.length === 0) {
      fetchEmailTemplates();
    }
  }, [open, emailTemplates.length, fetchEmailTemplates]);

  function openCompose(
    flow: EmailFlow,
    context?: { applicationId: string; jobId: string }
  ) {
    if (context) setApprovedContext(context);
    setPendingEmailFor(flow);
    setComposeOpen(true);
  }

  function handleComposeOpenChange(next: boolean) {
    setComposeOpen(next);
    if (!next) setApprovedContext(null);
  }

  function buildMode() {
    if (!candidate) return null;
    const templateType =
      pendingEmailFor === 'approve'
        ? 'offer'
        : pendingEmailFor === 'reject'
          ? 'rejection'
          : 'general';
    return buildTemplateComposeMode({
      candidate,
      candidateName,
      templateType,
      pendingApplication,
      contextOverride:
        pendingEmailFor === 'approve' ? (approvedContext ?? undefined) : undefined,
      emailTemplates,
      getClientIdForJob: jobId => jobs.find(j => j._id === jobId)?.clientId,
      getJobTitle,
      getClientName,
    });
  }

  return { composeOpen, openCompose, handleComposeOpenChange, buildMode };
}
