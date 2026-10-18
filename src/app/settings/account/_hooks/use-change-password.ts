import { useAuthStore } from '@/store/slices/auth.store';
import { useState } from 'react';
import { toast } from 'sonner';

export function useChangePassword() {
  const changePassword = useAuthStore(s => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  /** Typing clears any previous error or "updated" state. */
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setError('');
    setSaved(false);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Password changed successfully');
    } catch (err) {
      const msg = (err as Error).message || 'Failed to change password';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword: edit(setCurrentPassword),
    setNewPassword: edit(setNewPassword),
    setConfirmPassword: edit(setConfirmPassword),
    saving,
    saved,
    error,
    submit,
  };
}
