import { getJson } from '@/lib/api-client';
import { useEffect, useState } from 'react';

interface TagSuggestions {
  emr: string[];
  specialty: string[];
}

const EMPTY: TagSuggestions = { emr: [], specialty: [] };

/** EMR / speciality tags already used on other scorecards (autocomplete only). */
export function useScorecardTagSuggestions(open: boolean): TagSuggestions {
  const [suggestions, setSuggestions] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getJson<TagSuggestions>('/ats/interview-scorecards/tag-suggestions')
      .then(res => {
        if (!cancelled) setSuggestions(res);
      })
      .catch(() => {
        // Suggestions are a convenience; typing a new tag still works.
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return suggestions;
}
