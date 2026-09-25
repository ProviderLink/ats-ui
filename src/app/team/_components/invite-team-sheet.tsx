'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { logOptimisticActivity } from '@/lib/activity';
import { useUserStore } from '@/store/slices/users.store';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { UserRole } from '../_data/team';
import { ALL_ROLES, ROLE_LABELS } from '../_data/team';

type Props = {
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

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '' as UserRole | '',
};

export function InviteTeamSheet({ open, onOpenChange }: Props) {
  const { create, mutating } = useUserStore();
  const [form, setForm] = useState(EMPTY);

  function set<K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.role;

  async function handleSubmit() {
    if (!isValid || !form.role) return;
    try {
      const member = await create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        roles: [form.role],
      });
      logOptimisticActivity(
        'user',
        member._id,
        'created',
        `Team member ${member.firstName} ${member.lastName} invited`
      );
      toast.success('Team member invited');
      setForm(EMPTY);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to invite member');
    }
  }

  function handleClose(v: boolean) {
    if (!v) {
      setForm(EMPTY);
    }
    onOpenChange(v);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Invite Team Member</SheetTitle>
          <SheetDescription className="sr-only">
            Invite a new team member and choose their role.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name">
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
              />
            </Field>
            <Field label="Last Name">
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Email">
            <Input
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </Field>

          <Field label="Phone">
            <Input
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
            />
          </Field>

          <Field label="Role">
            <Select
              value={form.role}
              onValueChange={v => set('role', v as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map(r => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <SheetFooter className="border-t px-6 py-4 gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
            disabled={!isValid || mutating}
            onClick={handleSubmit}
          >
            {mutating ? 'Sending…' : 'Send Invite'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
