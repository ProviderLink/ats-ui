import { cn } from '@/lib/utils';
import { CheckCircleIcon, StarIcon, XCircleIcon } from 'lucide-react';
import React from 'react';
import { avatarColor } from './config';

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  );
}

export function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

export function BoolIndicator({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        value ? 'text-[#2d8a51] dark:text-[#69c58a]' : 'text-muted-foreground'
      )}
    >
      {value ? (
        <CheckCircleIcon className="size-3.5" />
      ) : (
        <XCircleIcon className="size-3.5" />
      )}
      {value ? trueLabel : falseLabel}
    </span>
  );
}

export function StarRating({ score }: { score?: number | null }) {
  if (score == null) return <Dash />;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn(
            'size-3.5',
            i < score
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
      <span className="ml-1.5 text-sm text-muted-foreground">{score}/5</span>
    </div>
  );
}

export function CompanyAvatar({ name, logo }: { name: string; logo?: string | null }) {
  const bg = avatarColor(name);
  if (logo)
    return (
      <img
        src={logo}
        alt={name}
        className="size-14 rounded-xl object-cover shrink-0"
      />
    );
  return (
    <div
      className={cn(
        'size-14 rounded-xl flex items-center justify-center shrink-0 select-none text-base font-semibold',
        bg
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
