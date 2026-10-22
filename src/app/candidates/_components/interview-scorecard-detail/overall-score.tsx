import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { InterviewScorecard } from "@/store/types/interview-scorecard.types";
import {
  FINAL_RECOMMENDATION_BADGE_CLASS,
  FINAL_RECOMMENDATION_LABELS,
} from "@/store/types/interview-scorecard.types";

interface ScoreSummaryProps {
  sc: InterviewScorecard;
  jobTitle?: string | null;
  clientName?: string | null;
  interviewerName?: string | null;
}

function Meta({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value}</dd>
      {sub && (
        <dd className="break-words text-xs text-muted-foreground">{sub}</dd>
      )}
    </div>
  );
}

export function ScoreSummary({
  sc,
  jobTitle,
  clientName,
  interviewerName,
}: ScoreSummaryProps) {
  const pct = Math.max(0, Math.min(100, sc.overallScore));
  return (
    <section className="grid gap-5 rounded-lg border p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Overall score
        </p>
        <p className="text-4xl font-semibold leading-none tabular-nums">
          {sc.overallScore.toFixed(1)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / 100
          </span>
        </p>
        <div className="h-1.5 w-full min-w-40 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recommendation
          </p>
          <Badge
            variant="outline"
            className={cn(
              "h-6 px-2.5 text-xs font-medium",
              FINAL_RECOMMENDATION_BADGE_CLASS[sc.finalRecommendation],
            )}
          >
            {FINAL_RECOMMENDATION_LABELS[sc.finalRecommendation]}
          </Badge>
        </div>
        <dl className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2">
          <Meta
            label="Job"
            value={jobTitle ?? "—"}
            sub={clientName}
            className="sm:col-span-2"
          />
          <Meta label="Interviewer" value={interviewerName ?? "—"} />
          <Meta label="Interview date" value={formatDate(sc.interviewDate)} />
        </dl>
      </div>
    </section>
  );
}
