import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import { CATEGORY_WEIGHTS } from '@/store/types/interview-scorecard.types';
import { RatingStars } from './rating-stars';

export function ScoreBreakdown({ sc }: { sc: InterviewScorecard }) {
  const rows = [
    {
      label: 'Communication',
      rating: sc.communicationRating,
      score: sc.communicationWeighted,
      max: CATEGORY_WEIGHTS.communication,
    },
    {
      label: 'Relevant experience',
      rating: sc.experienceRating,
      score: sc.experienceWeighted,
      max: CATEGORY_WEIGHTS.experience,
    },
    {
      label: 'Professionalism',
      rating: sc.professionalismRating,
      score: sc.professionalismWeighted,
      max: CATEGORY_WEIGHTS.professionalism,
    },
    {
      label: 'Office & technology',
      rating: sc.technologyRating,
      score: sc.technologyWeighted,
      max: CATEGORY_WEIGHTS.technology,
    },
    {
      label: 'Availability & fit',
      rating: sc.availabilityRating,
      score: sc.availabilityWeighted,
      max: CATEGORY_WEIGHTS.availability,
    },
  ];

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Score breakdown
      </h3>
      <ul className="divide-y rounded-lg border">
        {rows.map(r => (
          <li
            key={r.label}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[10rem_auto_1fr_4.5rem]"
          >
            <span className="text-sm font-medium">{r.label}</span>
            <RatingStars rating={r.rating} />
            <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted sm:col-span-1">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${(r.score / r.max) * 100}%` }}
              />
            </div>
            <span className="hidden text-right text-sm tabular-nums sm:block">
              {r.score.toFixed(1)}
              <span className="text-muted-foreground"> / {r.max}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
