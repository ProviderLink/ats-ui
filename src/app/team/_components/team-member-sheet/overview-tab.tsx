import { formatDate } from '@/lib/utils';
import type { User } from '@/store/types/user.types';
import { DetailRow, Empty, Section } from './detail-row';
import { formatDateTime, relativeWhen } from './format-when';

function SignIn({ value }: { value?: string | null }) {
  if (!value) return <Empty text="Never" />;
  const relative = relativeWhen(value);
  return (
    <div className="flex flex-col items-end">
      <span>{relative || formatDateTime(value)}</span>
      {relative && (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(value)}
        </span>
      )}
    </div>
  );
}

export function OverviewTab({ member }: { member: User }) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Contact">
        <DetailRow label="Email">
          <span className="break-all">{member.email}</span>
        </DetailRow>
        <DetailRow label="Phone">{member.phone || <Empty />}</DetailRow>
      </Section>

      <Section title="Account">
        <DetailRow label={member.isInviteAccepted ? 'Joined' : 'Invited on'}>
          {formatDate(member.createdAt)}
        </DetailRow>
        <DetailRow label="Email verified">
          {member.emailVerified ? 'Yes' : <Empty text="Not yet" />}
        </DetailRow>
      </Section>

      <Section title="Last active">
        <DetailRow label="ATS">
          <SignIn value={member.lastLoginAts} />
        </DetailRow>
        <DetailRow label="CRM">
          <SignIn value={member.lastLoginCrm} />
        </DetailRow>
      </Section>
    </div>
  );
}
