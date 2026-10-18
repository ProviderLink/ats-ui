import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';
import type { ScheduleInterviewInput } from '@/components/schedule-interview/schedule-interview-types';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { resolveScheduleInput } from '../_utils/resolve-schedule-input';
import { withToast } from '@/lib/with-toast';

interface SchedulableCandidate {
  applicationId: string;
  candidateId: string;
  jobId: string;
  clientId: string;
  firstName: string;
  lastName: string;
}

interface CreateEventDialogProps {
  users: { _id: string; firstName: string; lastName: string }[];
  timezone: string;
  defaultDate: string;
  onCreated: () => void;
  onClose: () => void;
}

export function CreateEventDialog({
  users,
  timezone,
  defaultDate,
  onCreated,
  onClose,
}: CreateEventDialogProps) {
  const candidates = useCandidateStore(s => s.items);
  const jobs = useJobStore(s => s.items);
  const applications = useApplicationStore(s => s.items);
  const createInterview = useInterviewStore(s => s.create);

  const [saving, setSaving] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  const openJobs = useMemo(() => jobs.filter(j => j.status === 'open'), [jobs]);

  // Approved applications only: an interview needs a live application, and the
  // create endpoint derives everything else from it.
  const schedulable = useMemo<SchedulableCandidate[]>(() => {
    const byId = new Map(candidates.map(c => [c._id, c]));
    return applications
      .filter(a => a.phase === 'approved')
      .map(a => {
        const c = byId.get(a.candidateId);
        if (!c) return null;
        return {
          applicationId: a._id,
          candidateId: a.candidateId,
          jobId: a.jobId,
          clientId: a.clientId,
          firstName: c.firstName,
          lastName: c.lastName,
        };
      })
      .filter((x): x is SchedulableCandidate => x !== null);
  }, [applications, candidates]);

  const candidatesForJob = useMemo(
    () => schedulable.filter(c => c.jobId === selectedJobId),
    [schedulable, selectedJobId]
  );

  const selectedCandidate = useMemo(
    () => schedulable.find(c => c.candidateId === selectedCandidateId) ?? null,
    [schedulable, selectedCandidateId]
  );

  const selectedJob = useMemo(
    () => jobs.find(j => j._id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  async function handleCreate(data: ScheduleInterviewInput) {
    if (!selectedCandidate) {
      toast.error('Select a candidate first');
      return;
    }
    const resolved = resolveScheduleInput(data, timezone);
    if (resolved.error !== undefined) {
      toast.error(resolved.error);
      return;
    }

    setSaving(true);
    try {
      await withToast('Interview scheduled — invitations sent', () =>
        createInterview({
        applicationId: selectedCandidate.applicationId,
        candidateId: selectedCandidate.candidateId,
        jobId: selectedCandidate.jobId,
        clientId: selectedCandidate.clientId,
        title: data.title,
        type: resolved.type,
        scheduledAt: resolved.scheduledAt,
        duration: data.duration,
        interviewerIds: data.interviewerIds,
        meetingDetails: resolved.meetingDetails,
        })
      );
      onCreated();
    } catch {
      // withToast already reported the failure.
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScheduleInterviewDialog
      open
      mode="create"
      onClose={onClose}
      loading={saving}
      candidateName={
        selectedCandidate
          ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
          : ''
      }
      candidates={candidatesForJob.map(c => ({
        _id: c.candidateId,
        firstName: c.firstName,
        lastName: c.lastName,
      }))}
      candidateId={selectedCandidateId}
      onCandidateChange={setSelectedCandidateId}
      job={selectedJob}
      jobs={openJobs.map(j => ({ _id: j._id, title: j.title }))}
      // The candidate list is scoped to the job, so switching jobs must drop
      // any previously chosen candidate.
      onJobChange={jobId => {
        setSelectedJobId(jobId);
        setSelectedCandidateId('');
      }}
      users={users}
      defaultDate={defaultDate}
      onConfirm={handleCreate}
    />
  );
}
