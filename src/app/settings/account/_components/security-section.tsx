import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckIcon, KeyRoundIcon } from 'lucide-react';
import { useChangePassword } from '../_hooks/use-change-password';
import { AccountField } from './account-field';
import { PasswordResetRow } from './password-reset-row';

export function SecuritySection() {
  const pw = useChangePassword();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRoundIcon className="size-4 text-pine-teal-700 dark:text-muted-foreground" />
          Password
        </CardTitle>
        <CardDescription>
          Change your password or request a reset link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={pw.submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <AccountField id="acc-current" label="Current password">
            <PasswordInput
              id="acc-current"
              toggleLabel="current password"
              value={pw.currentPassword}
              onChange={e => pw.setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </AccountField>
          <div className="hidden sm:block" />
          <AccountField id="acc-new" label="New password">
            <PasswordInput
              id="acc-new"
              toggleLabel="new password"
              value={pw.newPassword}
              onChange={e => pw.setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </AccountField>
          <AccountField id="acc-confirm" label="Confirm new password">
            <PasswordInput
              id="acc-confirm"
              toggleLabel="confirmation password"
              value={pw.confirmPassword}
              onChange={e => pw.setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </AccountField>

          {pw.error && (
            <p className="text-sm text-destructive sm:col-span-2">{pw.error}</p>
          )}

          <div className="flex justify-end sm:col-span-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={
                pw.saving ||
                !pw.currentPassword ||
                !pw.newPassword ||
                !pw.confirmPassword
              }
              className="gap-1.5"
            >
              {pw.saved && <CheckIcon className="size-3.5" />}
              {pw.saved
                ? 'Password updated'
                : pw.saving
                  ? 'Saving…'
                  : 'Change password'}
            </Button>
          </div>
        </form>

        <Separator />

        <PasswordResetRow />
      </CardContent>
    </Card>
  );
}
