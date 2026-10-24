import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PERMISSION_RESOURCES, RESOURCE_LABELS } from '@/lib/role-labels';
import { useAuthStore } from '@/store/slices/auth.store';
import type { UserPermissions } from '@/store/types';
import { CheckIcon, MinusIcon, ShieldCheckIcon, ShieldIcon } from 'lucide-react';

const PERM_COLS = ['read', 'write', 'manage', 'schedule', 'approve'] as const;
const PERM_LABELS: Record<(typeof PERM_COLS)[number], string> = {
  read: 'Read',
  write: 'Write',
  manage: 'Manage',
  schedule: 'Schedule',
  approve: 'Approve',
};

export function PermissionsTab() {
  const user = useAuthStore(s => s.user);
  const perms = (user?.permissions ?? {}) as UserPermissions;
  const isAdmin = (user?.roles ?? []).includes('admin');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheckIcon className="size-4 text-pine-teal-700 dark:text-muted-foreground" />
          Permissions
        </CardTitle>
        <CardDescription>
          Your resource-level access — managed by workspace admins
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-pine-teal-300 bg-pine-teal-100 px-3 py-2 text-xs text-pine-teal-900 dark:border-primary/20 dark:bg-primary/5 dark:text-muted-foreground">
            <ShieldIcon className="size-3.5 text-pine-teal-700 dark:text-primary" />
            You have admin access — all permissions are granted.
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-120">
            <thead>
              <tr className="border-b bg-gray-100 dark:bg-muted/40">
                <th className="h-10 px-5 text-left text-xs font-medium text-muted-foreground">
                  Resource
                </th>
                {PERM_COLS.map(p => (
                  <th
                    key={p}
                    className="h-10 px-3 text-center text-xs font-medium text-muted-foreground w-18"
                  >
                    {PERM_LABELS[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_RESOURCES.map(resource => (
                <tr
                  key={resource}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3 text-sm font-medium">
                    {RESOURCE_LABELS[resource]}
                  </td>
                  {PERM_COLS.map(perm => {
                    const granted =
                      isAdmin ||
                      !!(
                        perms[resource] as Record<string, boolean> | undefined
                      )?.[perm];
                    return (
                      <td key={perm} className="px-3 py-3 text-center">
                        {granted ? (
                          <CheckIcon className="size-4 text-emerald-700 dark:text-success mx-auto" />
                        ) : (
                          <MinusIcon className="size-4 text-gray-400 dark:text-muted-foreground/20 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
