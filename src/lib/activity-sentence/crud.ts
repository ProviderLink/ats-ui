import {
  str,
  num,
  strArray,
  pick,
  humanEnum,
  describeReason,
} from './format';
import { resourceLabel } from './resource-label';
import { summariseChanges } from './changes';
import type { SentenceHandler } from './scope';

export const describeCrud: SentenceHandler = ({ key, log, metadata, changes, ctx, unattributed, finish, impersonal }) => {
  switch (key) {
    case 'deleted': {
      if (log.resourceType === 'settings') {
        const reason = describeReason('deleted', metadata);
        if (reason) return finish(reason.text, reason.detail ?? '');
      }
      if (
        log.resourceType === 'pipeline_template' ||
        log.resourceType === 'email_template'
      ) {
        const name = pick(metadata, 'name');
        return finish(
          `deleted ${resourceLabel(log.resourceType)}${name ? ` \u201c${name}\u201d` : ''}`
        );
      }
      if (log.resourceType === 'user') {
        const name = pick(metadata, 'name');
        const roles = strArray(metadata['roles']);
        return finish(
          name ? `removed the team member ${name}` : 'removed a team member',
          roles.length > 0
            ? `Roles: ${roles.map(r => humanEnum(r)).join(', ')}`
            : ''
        );
      }
      return finish(`deleted ${resourceLabel(log.resourceType)}`);
    }

    // ── Candidate profile ────────────────────────────────────────────
    case 'created':
      if (log.relatedType === 'interview_scorecard') {
        const overall = num(metadata['overallScore']);
        return finish(
          'created an interview scorecard',
          overall !== null ? `Overall score: ${overall}/100` : null
        );
      }
      if (log.resourceType === 'candidate') {
        const source = str(metadata['source']);
        const appliedJobId = str(metadata['appliedJobId']);
        const job = appliedJobId ? (ctx.jobTitle?.(appliedJobId) ?? null) : null;
        const forJob = job ? ` for ${job}` : '';
        // A candidate created by a public application submitted it themselves;
        // there is no user to credit, so state the event without an actor
        // rather than crediting "System".
        if (source === 'applied' || source === 'direct_apply') {
          return unattributed
            ? impersonal(`the candidate applied${forJob}`)
            : finish(`added the candidate${forJob}`);
        }
        if (source === 'internal_upload')
          return finish(`uploaded the candidate${forJob}`);
        if (source === 'assigned') return finish('assigned the candidate');
        return finish(`added the candidate${forJob}`);
      }
      if (log.resourceType === 'user') {
        const roles = strArray(metadata['roles']);
        return finish(
          'invited a team member',
          roles.length > 0
            ? `Roles: ${roles.map(r => humanEnum(r)).join(', ')}`
            : null
        );
      }
      if (log.resourceType === 'settings') {
        const reason = describeReason('added', metadata);
        if (reason) return finish(reason.text, reason.detail ?? '');
      }
      if (
        log.resourceType === 'pipeline_template' ||
        log.resourceType === 'email_template'
      ) {
        const name = pick(metadata, 'name');
        return finish(
          `created ${resourceLabel(log.resourceType)}${name ? ` \u201c${name}\u201d` : ''}`
        );
      }
      if (log.resourceType === 'tag') return finish('created the tag');
      if (log.resourceType === 'assignment')
        return finish('created the assignment');
      if (log.resourceType === 'work_entry')
        return finish('logged a work entry');
      return finish(`created ${resourceLabel(log.resourceType)}`);

    case 'updated': {
      if (log.relatedType === 'interview_scorecard') {
        const overall = num(metadata['overallScore']);
        return finish(
          'updated an interview scorecard',
          overall !== null ? `Overall score: ${overall}/100` : null
        );
      }
      // Historical rows recorded a job status change as a generic `updated`
      // with `{ oldStatus, newStatus }`. Name it as the status change it is.
      const fromStatus = pick(metadata, 'oldStatus', 'fromStatus');
      const toStatus = pick(metadata, 'newStatus');
      if (fromStatus && toStatus) {
        return finish(
          `changed ${resourceLabel(log.resourceType)} status from ` +
            `${humanEnum(fromStatus)} to ${humanEnum(toStatus)}`
        );
      }
      if (log.resourceType === 'settings') {
        const reason = describeReason(
          metadata['deactivated'] === true ? 'deactivated' : 'edited',
          metadata
        );
        if (reason) return finish(reason.text, reason.detail ?? '');
      }
      const edit = summariseChanges(changes);
      if (edit) {
        const templateName =
          log.resourceType === 'pipeline_template' ||
          log.resourceType === 'email_template'
            ? pick(metadata, 'name')
            : null;
        const detailLine = [
          edit.detail,
          templateName ? `Template: ${templateName}` : null,
        ]
          .filter(Boolean)
          .join(' \u00b7 ');
        return finish(edit.headline, detailLine);
      }
      if (log.resourceType === 'tag') return finish('renamed the tag');
      if (log.resourceType === 'user')
        return finish('edited the team member');
      if (log.resourceType === 'assignment')
        return finish('edited the assignment');
      if (log.resourceType === 'work_entry')
        return finish('edited a work entry');
      break; // description (if any) is rendered by the fallback below
    }
  }
  return null;
};
