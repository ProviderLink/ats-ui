import {
  str,
  num,
  pick,
  humanEnum,
  formatScore,
  providerLabel,
  noteLabel,
} from './format';
import type { SentenceHandler } from './scope';

export const describeCandidate: SentenceHandler = ({ key, metadata, isValid, finish }) => {
  switch (key) {
    case 'status_changed': {
      // Key generations: `{ from, to }` and `{ oldStatus, newStatus }`.
      const from = pick(metadata, 'from', 'oldStatus', 'fromStatus');
      const to = pick(metadata, 'to', 'newStatus', 'status');
      return finish(
        from && to
          ? `changed status from ${humanEnum(from)} to ${humanEnum(to)}`
          : to
            ? `changed status to ${humanEnum(to)}`
            : 'changed the status'
      );
    }

    case 'eligibility_changed': {
      const to = pick(metadata, 'to');
      if (to === 'permanently_ineligible') {
        return finish('marked the candidate as permanently ineligible');
      }
      return finish('restored the candidate\u2019s eligibility');
    }

    case 'legal_hold_toggled': {
      const held = metadata['legalHold'] === true;
      return finish(
        held
          ? 'placed a legal hold on the candidate'
          : 'released the legal hold on the candidate'
      );
    }

    case 'talent_pool_added':
      return finish('added the candidate to the talent pool');

    case 'talent_pool_removed':
      return finish('removed the candidate from the talent pool');

    case 'parsed_data_updated': {
      const counts: string[] = [];
      const skills = num(metadata['skillsCount']);
      const experience = num(metadata['experienceCount']);
      const education = num(metadata['educationCount']);
      if (skills) counts.push(`${skills} skills`);
      if (experience) counts.push(`${experience} experience`);
      if (education) counts.push(`${education} education`);
      return finish(
        'parsed the resume',
        counts.length > 0 ? `Extracted ${counts.join(' \u00b7 ')}` : null
      );
    }

    case 'ai_score_updated':
    case 'candidate_scoring_completed': {
      const score = formatScore(num(metadata['score']));
      const recommendation = pick(metadata, 'recommendation');
      const engine = providerLabel(pick(metadata, 'provider'));
      const parts = [
        recommendation ? `Recommendation: ${humanEnum(recommendation)}` : null,
        engine ? `by ${engine}` : null,
      ].filter(Boolean);
      return finish(
        score ? `scored the candidate ${score}` : 'scored the candidate',
        parts.join(' \u00b7 ')
      );
    }

    case 'ai_validation_updated':
    case 'candidacy_validation_completed':
    case 'resume_validation_completed': {
      // `metadata.reason` is the AI's full rationale — 99–258 characters of
      // prose. It belongs on the candidate's validation panel, not in a
      // timeline, where it drowns the event it is describing.
      const score = formatScore(num(metadata['score']));
      const engine = providerLabel(pick(metadata, 'provider'));
      const reason = pick(metadata, 'reason');
      // A flagged application is worth knowing the why of; a passing one only
      // needs its score.
      const detailLine =
        isValid === false && reason
          ? `Reason: ${reason}`
          : [score ? `Score: ${score}` : null, engine ? `by ${engine}` : null]
              .filter(Boolean)
              .join(' \u00b7 ') || null;
      if (isValid === true) {
        return finish('validated the application as eligible', detailLine);
      }
      if (isValid === false) {
        return finish('flagged the application as ineligible', detailLine);
      }
      return finish('validated the application', detailLine);
    }

    case 'resume_parsing_completed': {
      const skills = num(metadata['skillsCount']);
      const experience = num(metadata['experienceCount']);
      const counts: string[] = [];
      if (skills) counts.push(`${skills} skills`);
      if (experience) counts.push(`${experience} experience`);
      return finish(
        'finished parsing the resume',
        counts.length > 0 ? `Extracted ${counts.join(' \u00b7 ')}` : null
      );
    }

    case 'note_added':
      return finish(`added ${noteLabel(str(metadata['method']))}`);

    case 'note_updated':
      return finish(`edited ${noteLabel(str(metadata['method']))}`);

    case 'note_deleted':
      return finish(`deleted ${noteLabel(str(metadata['method']))}`);
  }
  return null;
};
