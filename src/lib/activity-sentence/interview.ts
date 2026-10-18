import {
  num,
  pick,
  humanEnum,
  formatWhen,
  interviewTypeLabel,
  interviewTypePhrase,
} from './format';
import { summariseChanges } from './changes';
import type { SentenceHandler } from './scope';

export const describeInterview: SentenceHandler = ({ key, metadata, changes, ctx, finish }) => {
  switch (key) {
    case 'interview_scheduled': {
      const label = interviewTypeLabel(pick(metadata, 'interviewType'));
      const jobTitle = pick(metadata, 'jobTitle');
      const what = label ? interviewTypePhrase(label) : 'an interview';
      const when = formatWhen(metadata['scheduledAt'], ctx.timeZone);
      return finish(
        jobTitle ? `scheduled ${what} for ${jobTitle}` : `scheduled ${what}`,
        when ? `On ${when}` : ''
      );
    }

    case 'interview_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(edit.headline, edit.detail ?? '')
        : finish('edited the interview');
    }

    case 'interview_cancelled':
      return finish('cancelled the interview');

    case 'interview_completed':
      return finish('completed the interview');

    case 'interview_no_show':
      return finish('marked the interview as a no-show');

    case 'interview_feedback_submitted': {
      const rating = num(metadata['rating']);
      const recommendation = pick(metadata, 'recommendation');
      const parts = [
        rating !== null ? `Rating: ${rating}` : null,
        recommendation ? `Recommendation: ${humanEnum(recommendation)}` : null,
      ].filter(Boolean);
      return finish(
        'submitted interview feedback',
        parts.join(' \u00b7 ') || null
      );
    }
  }
  return null;
};
