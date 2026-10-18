import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/role-labels';
import { useAuthStore } from '@/store/slices/auth.store';
import { CameraIcon, Loader2Icon, MailIcon } from 'lucide-react';
import { useRef } from 'react';

const AVATAR_ACCENTS = [
  'from-pine-teal-400 to-pine-teal-600',
  'from-amber-400 to-orange-500',
  'from-indigo-400 to-blue-600',
  'from-sky-400 to-cyan-600',
  'from-emerald-400 to-green-600',
];

function avatarAccent(name: string) {
  return AVATAR_ACCENTS[
    [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_ACCENTS.length
  ];
}

type AuthUser = ReturnType<typeof useAuthStore.getState>['user'];

interface ProfileIdentityProps {
  user: AuthUser;
  uploading: boolean;
  onAvatarSelected: (file: File) => Promise<void>;
}

export function ProfileIdentity({
  user,
  uploading,
  onAvatarSelected,
}: ProfileIdentityProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase();
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || '—';
  const roles = user?.roles ?? [];
  const appAccess = user?.appAccess ?? [];

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:gap-5">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative size-20 shrink-0 self-center sm:self-start"
        disabled={uploading}
      >
        <Avatar className="size-20">
          {user?.avatar ? (
            <AvatarImage src={user.avatar} alt={fullName} />
          ) : (
            <AvatarFallback
              className={`bg-linear-to-br ${avatarAccent(initials)} text-xl font-semibold text-white`}
            >
              {initials || '?'}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {uploading ? (
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
        onChange={async e => {
          const file = e.target.files?.[0];
          if (file) await onAvatarSelected(file);
          e.target.value = '';
        }}
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
            disabled={uploading}
          >
            <CameraIcon className="size-3" />
            <span>{uploading ? 'Uploading…' : 'Change'}</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-muted-foreground">
            {user?.email ?? '—'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {roles.map(r => (
            <Badge key={r} variant="secondary" className="text-xs font-medium">
              {ROLE_LABELS[r] ?? r}
            </Badge>
          ))}
          {appAccess.map(a => (
            <Badge
              key={a}
              variant="outline"
              className="text-xs font-medium uppercase opacity-60"
            >
              {a}
            </Badge>
          ))}
          {appAccess.length === 0 && roles.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No roles assigned
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
