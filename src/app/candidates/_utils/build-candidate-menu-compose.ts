import type { ComposeMode } from '@/app/emails/_utils/compose-mode';
import { currentSenderName } from '@/app/emails/_utils/candidate-compose';
import type { Application, Candidate, Job } from '@/store/types';

interface Args {
  candidate: Candidate;
  candidateName: string;
  application?: Application;
  job?: Job;
  clientName: string;
}

export function buildCandidateMenuComposeMode({
  candidate,
  candidateName,
  application,
  job,
  clientName,
}: Args): ComposeMode {
  return {
    type: 'prefill',
    to: candidate.email,
    subject: '',
    body: '',
    templateType: 'general',
    context: application
      ? {
          type: 'general',
          candidateId: candidate._id,
          applicationId: application._id,
          jobId: application.jobId,
        }
      : { type: 'general', candidateId: candidate._id },
    variables: {
      candidateName,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone ?? '',
      jobTitle: job?.title ?? '',
      clientName,
      currentStage: application?.currentStage?.stageName ?? '',
      senderName: currentSenderName(),
    },
  };
}
