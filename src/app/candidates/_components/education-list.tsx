import type { ParsedEducation } from '@/store/types';
import { GraduationCapIcon } from 'lucide-react';

export function EducationList({ items }: { items: ParsedEducation[] }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No education listed.</p>
    );
  return (
    <div className="flex flex-col gap-3">
      {items.map((edu, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <GraduationCapIcon className="size-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {edu.degree} in {edu.field}
            </p>
            <p className="text-xs text-muted-foreground">
              {edu.institution} · {edu.year}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
