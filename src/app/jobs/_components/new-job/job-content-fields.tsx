import { RichTextEditor } from '@/components/rich-text-editor';
import { TagsSelector } from '@/components/tags-selector';
import type { Tag } from '@/store';
import type { JobFormState } from '../../_utils/job-form';
import { AiBadge } from './ai-badge';
import { DynamicList } from './dynamic-list';
import { FormField } from './form-field';
import { SkillsInput } from './skills-input';

interface JobContentFieldsProps {
  form: JobFormState;
  patch: (changes: Partial<JobFormState>) => void;
  tags: Tag[];
  aiFilled: Record<string, boolean>;
  onAiFieldEdited: (key: string) => void;
}

export function JobContentFields({
  form,
  patch,
  tags,
  aiFilled,
  onAiFieldEdited,
}: JobContentFieldsProps) {
  const badge = (key: string) => (aiFilled[key] ? <AiBadge /> : undefined);

  return (
    <>
      <FormField label="Description" required badge={badge('description')}>
        <RichTextEditor
          value={form.description}
          onChange={description => {
            patch({ description });
            onAiFieldEdited('description');
          }}
        />
      </FormField>

      <FormField label="Requirements" badge={badge('requirements')}>
        <DynamicList
          items={form.requirements}
          onChange={requirements => {
            patch({ requirements });
            onAiFieldEdited('requirements');
          }}
          placeholder="e.g. 3+ years of React experience"
        />
      </FormField>

      <FormField label="Responsibilities" badge={badge('responsibilities')}>
        <DynamicList
          items={form.responsibilities}
          onChange={responsibilities => {
            patch({ responsibilities });
            onAiFieldEdited('responsibilities');
          }}
          placeholder="e.g. Lead frontend architecture decisions"
        />
      </FormField>

      <FormField label="Skills" badge={badge('skills')}>
        <SkillsInput
          skills={form.skills}
          onChange={skills => {
            patch({ skills });
            onAiFieldEdited('skills');
          }}
        />
      </FormField>

      <FormField label="Tags">
        <TagsSelector
          allTags={tags}
          selectedIds={form.tagIds}
          onChange={tagIds => patch({ tagIds })}
        />
      </FormField>

      <FormField label="Benefits" badge={badge('benefits')}>
        <DynamicList
          items={form.benefits}
          onChange={benefits => {
            patch({ benefits });
            onAiFieldEdited('benefits');
          }}
          placeholder="e.g. Health insurance, 401k matching"
        />
      </FormField>
    </>
  );
}
