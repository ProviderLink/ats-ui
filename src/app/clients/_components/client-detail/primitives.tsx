import { cn } from '@/lib/utils';
import { CheckCircleIcon, StarIcon, XCircleIcon } from 'lucide-react';
import React from 'react';
import { ClientAvatar } from '../clients-table/client-avatar';

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

export function CompanyAvatar({
  name,
  logo,
}: {
  name: string;
  logo?: string | null;
}) {
  return (
    <ClientAvatar
      client={{ companyName: name, logo }}
      className="size-14 text-lg p-1"
    />
  );
}

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <dl className="divide-y">{children}</dl>
    </section>
  );
}

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-baseline gap-3 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}
