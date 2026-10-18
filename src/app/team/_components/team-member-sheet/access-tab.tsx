import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/role-labels';
import type { User } from '@/store/types/user.types';
import { getMemberPermissions } from '../../_utils/member-permissions';
import { DetailRow, Empty } from './detail-row';

export function AccessTab({ member }: { member: User }) {
  const permissions = getMemberPermissions(member);
  const appAccess = member.appAccess ?? [];

  return (
    <>
      <div className="divide-y">
        <DetailRow label="Roles">
          <div className="flex flex-wrap justify-end gap-1.5">
            {member.roles?.map(r => (
              <Badge key={r} variant="secondary" className="text-xs">
                {ROLE_LABELS[r] ?? r}
              </Badge>
            ))}
          </div>
        </DetailRow>
        <DetailRow label="App access">
          {appAccess.length === 0 ? (
            <Empty text="None" />
          ) : (
            <div className="flex justify-end gap-1.5">
              {appAccess.map(a => (
                <Badge key={a} variant="outline" className="uppercase text-xs">
                  {a}
                </Badge>
              ))}
            </div>
          )}
        </DetailRow>
      </div>

      {permissions.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium">Permissions</p>
          <div className="divide-y">
            {permissions.map(({ label, actions }) => (
              <DetailRow key={label} label={label}>
                <span className="text-xs text-muted-foreground">
                  {actions.length ? actions.join(' · ') : 'Allowed'}
                </span>
              </DetailRow>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
