import type React from 'react';

const HEADER_CLS =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground';

export function ColHeader({
  children,
  label,
  icon,
}: {
  children?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className={HEADER_CLS}>
      {icon}
      {children ?? label}
    </span>
  );
}
