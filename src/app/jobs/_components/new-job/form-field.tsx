import { Label } from '@/components/ui/label';
import type React from 'react';

export function FormField({
  label,
  required,
  badge,
  children,
}: {
  label: string;
  required?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-destructive text-xs leading-none">*</span>
        )}
        {badge}
      </Label>
      {children}
    </div>
  );
}
