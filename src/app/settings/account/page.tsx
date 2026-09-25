import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/slices/auth.store';
import { useUserStore } from '@/store/slices/users.store';
import type { UserPermissions } from '@/store/types';
import {
  CameraIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  MinusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  PERMISSION_RESOURCES,
  RESOURCE_LABELS,
  ROLE_LABELS,
} from '../_data/settings';

function getAvatarAccent(name: string) {
  const palette = [
    'from-pine-teal-400 to-pine-teal-600',
    'from-amber-400 to-orange-500',
    'from-indigo-400 to-blue-600',
    'from-sky-400 to-cyan-600',
    'from-emerald-400 to-green-600',
  ];
  return palette[
    [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  ];
}

// ─── Form Field ────────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        {hint && (
          <span className="text-[11px] text-muted-foreground/70">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const { updateMe, uploadAvatar, mutating } = useUserStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const initials = (firstName[0] ?? '') + (lastName[0] ?? '');
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || '—';

  const [formFirstName, setFormFirstName] = useState(firstName);
  const [formLastName, setFormLastName] = useState(lastName);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

  const isDirty =
    formFirstName !== firstName ||
    formLastName !== lastName ||
    phone !== (user?.phone ?? '');

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const updated = await uploadAvatar(file);
      setUser({ ...user, avatar: updated.avatar ?? user.avatar });
      toast.success('Avatar updated');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to upload avatar');
    } finally {
      e.target.value = '';
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      const updated = await updateMe({
        firstName: formFirstName,
        lastName: formLastName,
        phone,
      });
      setUser({
        ...user,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone ?? user.phone,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
      toast.success('Profile saved');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save profile');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserIcon className="size-4 text-muted-foreground" />
          Personal information
        </CardTitle>
        <CardDescription>
          Update your photo, name, and contact details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Avatar + identity row */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative size-20 shrink-0 self-center sm:self-start"
            disabled={mutating}
          >
            <Avatar className="size-20">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={fullName} />
              ) : (
                <AvatarFallback
                  className={`bg-linear-to-br ${getAvatarAccent(initials.toUpperCase())} text-xl font-semibold text-white`}
                >
                  {initials.toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {mutating ? (
                <Loader2Icon className="size-5 animate-spin text-white" />
              ) : (
                <CameraIcon className="size-5 text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold tracking-tight">
                {fullName}
              </h3>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                disabled={mutating}
              >
                <CameraIcon className="size-3" />
                <span>{mutating ? 'Uploading…' : 'Change'}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-muted-foreground">
                {user?.email ?? '—'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(user?.roles ?? []).map(r => (
                <Badge
                  key={r}
                  variant="secondary"
                  className="text-xs font-medium"
                >
                  {ROLE_LABELS[r] ?? r}
                </Badge>
              ))}
              {(user?.appAccess ?? []).map(a => (
                <Badge
                  key={a}
                  variant="outline"
                  className="text-xs font-medium uppercase opacity-60"
                >
                  {a}
                </Badge>
              ))}
              {(user?.appAccess ?? []).length === 0 &&
                (user?.roles ?? []).length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No roles assigned
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <form
          onSubmit={handleSaveProfile}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field id="acc-fname" label="First name">
            <Input
              id="acc-fname"
              value={formFirstName}
              onChange={e => setFormFirstName(e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
            />
          </Field>
          <Field id="acc-lname" label="Last name">
            <Input
              id="acc-lname"
              value={formLastName}
              onChange={e => setFormLastName(e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </Field>
          <Field id="acc-email" label="Email" hint="Read-only">
            <Input
              id="acc-email"
              type="email"
              value={user?.email ?? ''}
              readOnly
              disabled
              className="cursor-not-allowed opacity-70"
            />
          </Field>
          <Field id="acc-phone" label="Phone">
            <Input
              id="acc-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2 sm:col-span-2">
            {isDirty && !profileSaved && (
              <span className="text-xs text-muted-foreground">
                Unsaved changes
              </span>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={mutating || (!isDirty && !profileSaved)}
              className="gap-1.5"
            >
              {profileSaved ? (
                <>
                  <CheckIcon className="size-3.5" />
                  Saved
                </>
              ) : mutating ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const user = useAuthStore(s => s.user);
  const changePassword = useAuthStore(s => s.changePassword);
  const forgotPassword = useAuthStore(s => s.forgotPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
      toast.success('Password changed successfully');
    } catch (err) {
      const msg = (err as Error).message || 'Failed to change password';
      setPwError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReset() {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await forgotPassword(user.email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
      toast.success(`Reset link sent to ${user.email}`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to send reset link');
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRoundIcon className="size-4 text-muted-foreground" />
          Password
        </CardTitle>
        <CardDescription>
          Change your password or request a reset link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={handleChangePassword}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field id="acc-current" label="Current password">
            <div className="relative">
              <Input
                id="acc-current"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => {
                  setCurrentPassword(e.target.value);
                  setPwError('');
                  setPwSaved(false);
                }}
                placeholder="Enter current password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showCurrent ? 'Hide current password' : 'Show current password'
                }
              >
                {showCurrent ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </Field>
          <div className="hidden sm:block" />
          <Field id="acc-new" label="New password">
            <div className="relative">
              <Input
                id="acc-new"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  setPwError('');
                  setPwSaved(false);
                }}
                placeholder="At least 8 characters"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showNew ? 'Hide new password' : 'Show new password'
                }
              >
                {showNew ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </Field>
          <Field id="acc-confirm" label="Confirm new password">
            <Input
              id="acc-confirm"
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setPwError('');
                setPwSaved(false);
              }}
              placeholder="Re-enter new password"
            />
          </Field>

          {pwError && (
            <p className="text-sm text-destructive sm:col-span-2">{pwError}</p>
          )}

          <div className="flex justify-end sm:col-span-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={
                saving || !currentPassword || !newPassword || !confirmPassword
              }
              className="gap-1.5"
            >
              {pwSaved && <CheckIcon className="size-3.5" />}
              {pwSaved
                ? 'Password updated'
                : saving
                  ? 'Saving…'
                  : 'Change password'}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <MailIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Forgot your password? We can send a reset link to{' '}
              <span className="font-medium text-foreground">{user?.email}</span>
              .
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sendingReset || resetEmailSent}
            onClick={handleSendReset}
            className="shrink-0"
          >
            {resetEmailSent
              ? 'Reset link sent'
              : sendingReset
                ? 'Sending…'
                : 'Send reset link'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Permissions Tab ──────────────────────────────────────────────────────────

const PERM_COLS = ['read', 'write', 'manage', 'schedule', 'approve'] as const;
const PERM_LABELS: Record<(typeof PERM_COLS)[number], string> = {
  read: 'Read',
  write: 'Write',
  manage: 'Manage',
  schedule: 'Schedule',
  approve: 'Approve',
};

function PermissionsTab() {
  const user = useAuthStore(s => s.user);
  const perms = (user?.permissions ?? {}) as UserPermissions;
  const isAdmin = (user?.roles ?? []).includes('admin');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheckIcon className="size-4 text-muted-foreground" />
          Permissions
        </CardTitle>
        <CardDescription>
          Your resource-level access — managed by workspace admins
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <ShieldIcon className="size-3.5 text-primary" />
            You have admin access — all permissions are granted.
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-120">
            <thead>
              <tr className="border-b bg-muted/40">
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
                    const granted = isAdmin
                      ? true
                      : !!(
                          perms[resource] as Record<string, boolean> | undefined
                        )?.[perm];
                    return (
                      <td key={perm} className="px-3 py-3 text-center">
                        {granted ? (
                          <CheckIcon className="size-4 text-success mx-auto" />
                        ) : (
                          <MinusIcon className="size-4 text-muted-foreground/20 mx-auto" />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-card text-foreground shadow-sm ring-1 ring-border-subtle'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

export default function SettingsAccountPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div>
        <h1 className="text-base font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your profile, security, and permissions
        </p>
      </div>

      <nav className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        <TabButton
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          icon={UserIcon}
          label="Profile & Security"
        />
        <TabButton
          active={activeTab === 'permissions'}
          onClick={() => setActiveTab('permissions')}
          icon={ShieldCheckIcon}
          label="Permissions"
        />
      </nav>

      <div>
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <ProfileSection />
            <SecuritySection />
          </div>
        )}
        {activeTab === 'permissions' && <PermissionsTab />}
      </div>
    </div>
  );
}
