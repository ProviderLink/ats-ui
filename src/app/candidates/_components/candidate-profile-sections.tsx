import { Separator } from '@/components/ui/separator';
import type { Candidate } from '@/store/types';
import { StarIcon } from 'lucide-react';
import { EducationList } from './education-list';
import { ExperienceTimeline } from './experience-timeline';
import { SectionLabel } from './section-label';

/** Summary, skills, experience and education parsed from the resume. */
export function CandidateProfileSections({ candidate }: { candidate: Candidate }) {
  const { parsedData } = candidate;
  const skills = parsedData?.skills ?? [];
  const languages = parsedData?.languages ?? [];
  const certifications = parsedData?.certifications ?? [];
  const experience = parsedData?.experience ?? [];
  const education = parsedData?.education ?? [];

  return (
    <>
      {parsedData?.summary && (
        <>
          <div className="flex flex-col gap-2">
            <SectionLabel>Summary</SectionLabel>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsedData.summary}
            </p>
          </div>
          <Separator />
        </>
      )}

      {skills.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            <SectionLabel>Skills</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {skills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex h-5 items-center rounded-full border border-border bg-muted px-2 text-xs font-medium dark:bg-transparent"
                >
                  {skill}
                </span>
              ))}
            </div>
            {languages.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  Languages:
                </span>
                {languages.map(lang => (
                  <span key={lang} className="text-xs font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            )}
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {certifications.map(cert => (
                  <span
                    key={cert}
                    className="inline-flex h-5 items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2 text-xs font-medium text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    <StarIcon className="size-2.5" />
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Separator />
        </>
      )}

      {experience.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            <SectionLabel>Experience</SectionLabel>
            <ExperienceTimeline items={experience} />
          </div>
          <Separator />
        </>
      )}

      {education.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            <SectionLabel>Education</SectionLabel>
            <EducationList items={education} />
          </div>
          <Separator />
        </>
      )}
    </>
  );
}
