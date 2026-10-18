import {
  str,
  num,
  pick,
  formatScore,
} from './format';
import type { SentenceHandler } from './scope';

export const describePipeline: SentenceHandler = ({ key, metadata, finish }) => {
  switch (key) {
    case 'stage_changed': {
      // Two key generations exist in the data: `{ from, to }` and
      // `{ fromStageName, toStageName }`. Accept both.
      const from = pick(metadata, 'from', 'fromStage', 'fromStageName');
      const to = pick(
        metadata,
        'to',
        'toStage',
        'toStageName',
        'stageName',
        'stage'
      );
      if (from && to) {
        return finish(`moved from ${from} to ${to}`);
      }
      if (to) return finish(`moved to ${to}`);
      return finish('changed the stage');
    }

    case 'applied': {
      const source = str(metadata['source']);
      if (source === 'assigned') {
        return finish('assigned the candidate to this job');
      }
      if (source === 'internal_upload') {
        return finish('added the candidate to this job');
      }
      return finish('submitted an application');
    }

    case 'ineligible_reapply_blocked': {
      return finish('blocked a re-application', 'Permanently ineligible');
    }

    case 'approved': {
      const stageName = pick(metadata, 'stageName');
      const aiScore = formatScore(num(metadata['aiScore']));
      return finish(
        stageName
          ? `approved the candidate into ${stageName}`
          : 'approved the application',
        aiScore ? `AI score at approval: ${aiScore}` : ''
      );
    }

    case 'rejected': {
      const reason = pick(metadata, 'reason', 'rejectionReason');
      const destination = str(metadata['destination']);
      const lastStage = pick(metadata, 'lastStage');

      // The destination is only present on the candidate's last live
      // application; say where they went on the detail line.
      const parts = [
        reason ? `Reason: ${reason}` : null,
        destination === 'permanently_ineligible'
          ? 'Permanently ineligible'
          : destination === 'candidate_pool'
            ? 'Moved to talent pool'
            : null,
        lastStage ? `Last stage: ${lastStage}` : null,
      ].filter(Boolean);

      return finish(
        'rejected the application',
        parts.length > 0 ? parts.join(' \u00b7 ') : null
      );
    }

    case 'job_changed': {
      // A move, not a rejection — the recruiter needs to see where the
      // candidate went without it reading as a rejection.
      const movedTo = pick(metadata, 'movedToJobTitle');
      const lastStage = pick(metadata, 'lastStage');

      const parts = [
        movedTo ? `Now on: ${movedTo}` : null,
        lastStage ? `Left at: ${lastStage}` : null,
      ].filter(Boolean);

      return finish(
        metadata['movedToTalentPool'] === true
          ? 'moved the candidate to the talent pool'
          : 'moved the candidate to another job',
        parts.length > 0 ? parts.join(' \u00b7 ') : null
      );
    }

    case 'hired':
      return finish('hired the candidate');

    case 'disposition': {
      const destination = str(metadata['destination']);
      const reasonLabel = pick(metadata, 'reasonLabel');
      const lastStage = pick(metadata, 'lastStage');

      // Internal notes can be a paragraph; the reason, the destination and the
      // last stage are what a reader actually needs.
      const parts = [
        reasonLabel ? `Reason: ${reasonLabel}` : null,
        destination === 'permanently_ineligible'
          ? 'Permanently ineligible'
          : destination === 'candidate_pool'
            ? 'Moved to talent pool'
            : null,
        lastStage ? `Last stage: ${lastStage}` : null,
      ].filter(Boolean);

      return finish(
        'closed the application',
        parts.length > 0 ? parts.join(' \u00b7 ') : null
      );
    }

    case 'notes_updated':
      return finish('updated the application notes');

    case 'pipeline_changed': {
      const templateName = pick(metadata, 'templateName');
      const remapped = num(metadata['applicationsRemapped']);
      const parts = [
        templateName ? `Template: ${templateName}` : null,
        remapped !== null
          ? `${remapped} application${remapped === 1 ? '' : 's'} remapped`
          : null,
      ].filter(Boolean);
      return finish('changed the job pipeline', parts.join(' \u00b7 ') || null);
    }
  }
  return null;
};
