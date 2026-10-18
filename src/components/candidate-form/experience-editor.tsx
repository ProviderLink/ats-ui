import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ParsedExperience } from '@/store/types';
import { PlusIcon, XIcon } from 'lucide-react';
import { Field } from './field';

export function ExperienceEditor({
  entries,
  onChange,
}: {
  entries: ParsedExperience[];
  onChange: (entries: ParsedExperience[]) => void;
}) {
  function update(index: number, field: keyof ParsedExperience, val: string) {
    onChange(entries.map((e, i) => (i === index ? { ...e, [field]: val } : e)));
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, i) => (
        <Card key={i} className="rounded-sm">
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Experience {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
                aria-label={`Remove experience ${i + 1}`}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Company">
                <Input
                  value={entry.company}
                  onChange={e => update(i, 'company', e.target.value)}
                />
              </Field>
              <Field label="Title">
                <Input
                  value={entry.title}
                  onChange={e => update(i, 'title', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Duration">
              <Input
                value={entry.duration}
                onChange={e => update(i, 'duration', e.target.value)}
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={entry.description}
                onChange={e => update(i, 'description', e.target.value)}
                className="resize-none"
              />
            </Field>
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
            { company: '', title: '', duration: '', description: '' },
          ])
        }
      >
        <PlusIcon />
        Add Experience
      </Button>
    </div>
  );
}
