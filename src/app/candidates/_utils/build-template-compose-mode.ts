import type { ComposeMode } from '@/app/emails/_components/compose-email-sheet';
import { currentSenderName } from '@/app/emails/_utils/candidate-compose';
import type { Application, Candidate, EmailTemplate } from '@/store/types';
import { defaultSubject, substituteTemplate } from './email-template';

export type ComposeTemplateType =
  | 'offer'
  | 'rejection'
  | 'general'
  | 'follow_up';

interface ApplicationContext {
  applicationId: string;
  jobId: string;
}

interface BuildArgs {
  candidate: Candidate;
  candidateName: string;
  templateType: ComposeTemplateType;
  pendingApplication: Application | null;
  /** Overrides the pending application, e.g. the one just created by an approval. */
  contextOverride?: ApplicationContext;
  emailTemplates: EmailTemplate[];
  getClientIdForJob: (jobId: string) => string | undefined;
  getJobTitle: (jobId: string) => string;
  getClientName: (clientId: string) => string;
}

/**
 * ComposeEmailSheet "prefill" mode with the active template of `templateType`
 * substituted for one candidate, scoped to an application when there is one.
 */
export function buildTemplateComposeMode({
  candidate,
  candidateName,
  templateType,
  pendingApplication,
  contextOverride,
  emailTemplates,
  getClientIdForJob,
  getJobTitle,
  getClientName,
}: BuildArgs): ComposeMode {
  const appCtx =
    contextOverride ??
    (pendingApplication
      ? {
          applicationId: pendingApplication._id,
          jobId: pendingApplication.jobId,
        }
      : null);
  const clientId = appCtx
    ? (getClientIdForJob(appCtx.jobId) ?? pendingApplication?.clientId ?? '')
    : (pendingApplication?.clientId ?? '');
  const vars = {
    candidateName,
    candidateEmail: candidate.email,
    candidatePhone: candidate.phone ?? '',
    jobTitle: appCtx ? getJobTitle(appCtx.jobId) : '',
    clientName: appCtx ? getClientName(clientId) : '',
    currentStage: pendingApplication?.currentStage?.stageName ?? '',
    senderName: currentSenderName(),
  };
  const tpl = emailTemplates.find(t => t.type === templateType && t.isActive);
  return {
    type: 'prefill',
    to: candidate.email,
    subject: tpl?.subject
      ? substituteTemplate(tpl.subject, vars)
      : defaultSubject(templateType),
    body: tpl?.bodyText ? substituteTemplate(tpl.bodyText, vars) : '',
    templateType,
    context: appCtx
      ? {
          type: templateType,
          candidateId: candidate._id,
          applicationId: appCtx.applicationId,
          jobId: appCtx.jobId,
        }
      : { type: templateType, candidateId: candidate._id },
    variables: vars,
  };
}
