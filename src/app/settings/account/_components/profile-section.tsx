import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/slices/auth.store';
import { useUserStore } from '@/store/slices/users.store';
import { CheckIcon, Loader2Icon, UserIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AccountField } from './account-field';
import { ProfileIdentity } from './profile-identity';

export function ProfileSection() {
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const updateMe = useUserStore(s => s.updateMe);
  const uploadAvatar = useUserStore(s => s.uploadAvatar);
  const mutating = useUserStore(s => s.mutating);

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const [formFirstName, setFormFirstName] = useState(firstName);
  const [formLastName, setFormLastName] = useState(lastName);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

  const isDirty =
    formFirstName !== firstName ||
    formLastName !== lastName ||
    phone !== (user?.phone ?? '');

  async function handleAvatarSelected(file: File) {
    if (!user) return;
    try {
      const updated = await uploadAvatar(file);
      setUser({ ...user, avatar: updated.avatar ?? user.avatar });
      toast.success('Avatar updated');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to upload avatar');
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
          <UserIcon className="size-4 text-pine-teal-700 dark:text-muted-foreground" />
          Personal information
        </CardTitle>
        <CardDescription>
          Update your photo, name, and contact details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileIdentity
          user={user}
          uploading={mutating}
          onAvatarSelected={handleAvatarSelected}
        />

        <form
          onSubmit={handleSaveProfile}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <AccountField id="acc-fname" label="First name">
            <Input
              id="acc-fname"
              value={formFirstName}
              onChange={e => setFormFirstName(e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
            />
          </AccountField>
          <AccountField id="acc-lname" label="Last name">
            <Input
              id="acc-lname"
              value={formLastName}
              onChange={e => setFormLastName(e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </AccountField>
          <AccountField id="acc-email" label="Email" hint="Read-only">
            <Input
              id="acc-email"
              type="email"
              value={user?.email ?? ''}
              readOnly
              disabled
              className="cursor-not-allowed opacity-70"
            />
          </AccountField>
          <AccountField id="acc-phone" label="Phone">
            <Input
              id="acc-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />
          </AccountField>

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
