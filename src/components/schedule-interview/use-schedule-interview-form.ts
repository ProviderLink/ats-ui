import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import { useAuthStore } from '@/store/slices/auth.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { Job } from '@/store/types';
import { useMemo, useState } from 'react';
import { nextHourDefaults } from './next-hour-defaults';
import {
  DEFAULT_DURATION,
  type ScheduleInterviewInitial,
  type ScheduleInterviewInput,
} from './schedule-interview-types';

interface UseScheduleInterviewFormArgs {
  candidateName: string;
  job: Job | null;
  jobs: { _id: string; title: string }[];
  initial?: ScheduleInterviewInitial;
  defaultDate?: string;
}

export function useScheduleInterviewForm({
  candidateName,
  job,
  jobs,
  initial,
  defaultDate,
}: UseScheduleInterviewFormArgs) {
  const currentUser = useAuthStore(s => s.user);
  const settings = useSettingsStore(s => s.settings);
  const timezone = settings?.companyTimezone || DEFAULT_TIMEZONE;

  // The title is a DERIVED suggestion with an override. Seeding it with
  // `useState` froze the value at mount, so in the calendar flow — where the
  // candidate is chosen AFTER the form opens — it never named the candidate.
  const [titleOverride, setTitleOverride] = useState<string | null>(
    () => initial?.title ?? null
  );
  const title =
    titleOverride ??
    `Interview - ${candidateName || 'Candidate'} for ${job?.title ?? 'this job'}`;
  const [type, setType] = useState(() => initial?.type ?? 'zoom');
  const [jobId, setJobId] = useState(() => initial?.jobId ?? job?._id ?? '');
  const { date: hourDate, time: defaultTime } = nextHourDefaults(timezone);
  const [date, setDate] = useState(
    () => initial?.date ?? defaultDate ?? hourDate
  );
  const [time, setTime] = useState(() => initial?.time ?? defaultTime);
  const [duration, setDuration] = useState<number>(
    () => initial?.duration ?? DEFAULT_DURATION
  );
  // The organiser is the implicit interviewer, so the field starts pre-filled
  // instead of empty — an empty list used to block the Schedule button.
  const [interviewerIds, setInterviewerIds] = useState<string[]>(() =>
    initial ? initial.interviewerIds : currentUser?._id ? [currentUser._id] : []
  );
  const [meetingLink, setMeetingLink] = useState(
    () => initial?.meetingLink ?? ''
  );
  const [phoneNumber, setPhoneNumber] = useState(
    () => initial?.phoneNumber ?? ''
  );
  const [address, setAddress] = useState(() => initial?.address ?? '');

  const jobOptions = useMemo(() => {
    const map = new Map<string, string>();
    if (job) map.set(job._id, job.title);
    for (const j of jobs) map.set(j._id, j.title);
    return Array.from(map.entries()).map(([_id, title]) => ({ _id, title }));
  }, [jobs, job]);

  const input: ScheduleInterviewInput = {
    title,
    type,
    jobId,
    scheduledAt: date && time ? `${date}T${time}:00` : '',
    duration,
    interviewerIds,
    meetingLink,
    phoneNumber,
    address,
  };

  return {
    timezone,
    currentUserId: currentUser?._id,
    jobOptions,
    input,
    date,
    setDate,
    time,
    setTime,
    duration,
    setDuration,
    type,
    setType,
    jobId,
    setJobId,
    title,
    setTitleOverride,
    interviewerIds,
    setInterviewerIds,
    meetingLink,
    setMeetingLink,
    phoneNumber,
    setPhoneNumber,
    address,
    setAddress,
  };
}
