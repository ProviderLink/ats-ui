import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/password-input';

interface NewPasswordFieldsProps {
  passwordLabel: string;
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
}

export function NewPasswordFields({
  passwordLabel,
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
}: NewPasswordFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{passwordLabel}</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          required
          toggleLabel={passwordLabel.toLowerCase()}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <PasswordInput
          id="confirm"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirm}
          onChange={e => onConfirmChange(e.target.value)}
          required
          toggleLabel="confirm password"
        />
      </div>
    </>
  );
}
