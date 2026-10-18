interface CandidateCountLineProps {
  loading: boolean;
  count: number;
  hasFilters: boolean;
  /** Completes "N candidates …" when no filter is active, e.g. "hired". */
  unfilteredSuffix: string;
}

export function CandidateCountLine({
  loading,
  count,
  hasFilters,
  unfilteredSuffix,
}: CandidateCountLineProps) {
  return (
    <p className="text-xs text-muted-foreground -mt-1 shrink-0">
      {loading && count === 0
        ? 'Loading…'
        : `${count} ${count === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ` ${unfilteredSuffix}`}`}
    </p>
  );
}
