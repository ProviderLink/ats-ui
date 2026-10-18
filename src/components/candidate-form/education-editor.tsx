import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ParsedEducation } from '@/store/types';
import { PlusIcon, XIcon } from 'lucide-react';
import { Field } from './field';

export function EducationEditor({
  entries,
  onChange,
}: {
  entries: ParsedEducation[];
  onChange: (entries: ParsedEducation[]) => void;
}) {
  function update(index: number, field: keyof ParsedEducation, val: string) {
    onChange(entries.map((e, i) => (i === index ? { ...e, [field]: val } : e)));
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, i) => (
        <Card key={i} className="rounded-sm">
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Education {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
                aria-label={`Remove education ${i + 1}`}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Institution">
                <Input
                  value={entry.institution}
                  onChange={e => update(i, 'institution', e.target.value)}
                />
              </Field>
              <Field label="Degree">
                <Input
                  value={entry.degree}
                  onChange={e => update(i, 'degree', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Field of Study">
                <Input
                  value={entry.field}
                  onChange={e => update(i, 'field', e.target.value)}
                />
              </Field>
              <Field label="Year">
                <Input
                  value={entry.year}
                  onChange={e => update(i, 'year', e.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          onChange([
            ...entries,
            { institution: '', degree: '', field: '', year: '' },
          ])
        }
      >
        <PlusIcon />
        Add Education
      </Button>
    </div>
  );
}
