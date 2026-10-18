import { formatDate } from '@/lib/utils';
import type { User } from '@/store/types/user.types';
import { DetailRow, Empty } from './detail-row';

export function OverviewTab({ member }: { member: User }) {
  return (
    <>
      <DetailRow label="Phone">{member.phone || <Empty />}</DetailRow>
      <DetailRow label="Joined">{formatDate(member.createdAt)}</DetailRow>
      <DetailRow label="Last updated">
        {member.updatedAt ? formatDate(member.updatedAt) : <Empty />}
      </DetailRow>
      <DetailRow label="Last sign-in (ATS)">
        {member.lastLoginAts ? (
          formatDate(member.lastLoginAts)
        ) : (
          <Empty text="Never" />
        )}
      </DetailRow>
      <DetailRow label="Last sign-in (CRM)">
        {member.lastLoginCrm ? (
          formatDate(member.lastLoginCrm)
        ) : (
          <Empty text="Never" />
        )}
      </DetailRow>
    </>
  );
}
