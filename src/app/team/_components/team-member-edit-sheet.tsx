'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { logOptimisticActivity } from '@/lib/activity';
import { useUserStore } from '@/store/slices/users.store';
import type { User } from '@/store/types/user.types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { UserRole } from '../_data/team';
import { ALL_ROLES, ROLE_LABELS } from '../_data/team';

type Props = {
  member: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function TeamMemberEditSheet({ member, open, onOpenChange }: Props) {
  const { update, mutating } = useUserStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open && member) {
      setFirstName(member.firstName);
      setLastName(member.lastName);
      setPhone(member.phone ?? '');
      setRoles((member.roles as UserRole[]) ?? []);
      setIsActive(member.isActive);
    }
  }, [open, member]);

  function toggleRole(role: UserRole) {
    setRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  const isValid = firstName.trim() && lastName.trim() && roles.length > 0;

  async function handleSave() {
    if (!member || !isValid) return;
    try {
      await update(member._id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        roles,
        isActive,
      });
      logOptimisticActivity(
        'user',
        member._id,
        'permissions_updated',
        `Team member ${firstName} ${lastName} updated`
      );
      toast.success('Member updated');
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update member');
    }
  }

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 w-full sm:max-w-sm"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-base">Edit Member</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {!member.isInviteAccepted && (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-500/40 dark:text-amber-300">
              <span className="mt-0.5 shrink-0 text-base leading-none">⚠️</span>
              <span>
                This member hasn&apos;t accepted their invitation yet. Edits are
                not available until the invite is accepted.
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name">
              <Input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </Field>
            <Field label="Last Name">
              <Input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </Field>
          </div>

          <Field label="Phone">
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </Field>

          <Field label="Roles">
            <div className="flex flex-col gap-2.5 pt-1">
              {ALL_ROLES.map(role => (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role}`}
                    checked={roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <label
                    htmlFor={`role-${role}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    {ROLE_LABELS[role]}
                  </label>
                </div>
              ))}
            </div>
          </Field>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Active</span>
              <span className="text-xs text-muted-foreground">
                Inactive members cannot log in
              </span>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4 gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
            onClick={handleSave}
            disabled={!isValid || mutating || !member.isInviteAccepted}
          >
            {mutating
              ? 'Saving…'
              : !member.isInviteAccepted
                ? 'Invite pending'
                : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
