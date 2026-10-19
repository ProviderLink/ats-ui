import { Badge } from '@/components/ui/badge';
import type { User } from '@/store/types/user.types';
import { getMemberPermissions } from '../../_utils/member-permissions';
import { RoleBadges } from '../role-badge';
import { DetailRow, Empty, Section } from './detail-row';

export function AccessTab({ member }: { member: User }) {
  const permissions = getMemberPermissions(member);
  const appAccess = member.appAccess ?? [];
  const roles = member.roles ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Section title="Role and apps">
        <DetailRow label="Roles">
          <RoleBadges roles={roles} className="justify-end" />
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
      </Section>

      <Section title="Permissions">
        {permissions.length === 0 ? (
          <p className="py-2.5 text-sm text-muted-foreground">
            {roles.includes('admin')
              ? 'Admins have full access.'
              : 'No extra permissions granted.'}
          </p>
        ) : (
          permissions.map(({ label, actions }) => (
            <DetailRow key={label} label={label}>
              <span className="text-xs text-muted-foreground">
                {actions.length ? actions.join(' · ') : 'Allowed'}
              </span>
            </DetailRow>
          ))
        )}
      </Section>
    </div>
  );
}
