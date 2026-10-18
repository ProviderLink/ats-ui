export function OverallScore({ score }: { score: number }) {
  return (
    <section className="rounded-lg border p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Overall Score
        </p>
        <p className="text-3xl font-semibold">
          {score.toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground">
            /100
          </span>
        </p>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        <p>Server-computed on save</p>
        <p>Editable anytime</p>
      </div>
    </section>
  );
}
