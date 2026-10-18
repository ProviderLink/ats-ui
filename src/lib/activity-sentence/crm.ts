import {
  str,
  num,
  strArray,
  pick,
  humanEnum,
  humanKey,
  upperFirst,
} from './format';
import { summariseChanges } from './changes';
import { DAY_MONTH_FORMAT, LOCALE } from '../activity-time';
import type { SentenceHandler } from './scope';

export const describeCrm: SentenceHandler = ({ key, metadata, changes, finish }) => {
  switch (key) {
    case 'scorecard_generated': {
      // The weekly VA productivity scorecards (CRM), not interview scorecards.
      const count = num(metadata['count']);
      const week = str(metadata['weekStart']);
      const weekDate = week ? new Date(`${week}T12:00:00`) : null;
      const weekLabel =
        weekDate && !Number.isNaN(weekDate.getTime())
          ? `Week of ${new Intl.DateTimeFormat(LOCALE, DAY_MONTH_FORMAT).format(weekDate)}`
          : null;
      const parts = [
        count !== null ? `${count} scorecard${count === 1 ? '' : 's'}` : null,
        weekLabel,
      ].filter(Boolean);
      return finish(
        'generated the weekly scorecards',
        parts.join(' \u00b7 ')
      );
    }

    case 'contact_added': {
      const name = pick(metadata, 'contactName');
      return finish(name ? `added the contact ${name}` : 'added a contact');
    }

    case 'contact_updated': {
      const name = pick(metadata, 'contactName');
      const edit = summariseChanges(changes);
      const who = name ? `${name}\u2019s` : 'a contact\u2019s';
      return edit
        ? finish(`changed ${who} ${edit.fields}`, edit.detail ?? '')
        : finish(name ? `edited the contact ${name}` : 'edited a contact');
    }

    case 'contact_removed':
      return finish('removed a contact');

    case 'crm_profile_updated':
    case 'crm_client_account_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(`changed CRM ${edit.fields}`, edit.detail ?? '')
        : finish('edited the CRM profile');
    }

    case 'va_profile_updated': {
      const fields = strArray(metadata['fields']).map(f => humanKey(f));
      return fields.length > 0
        ? finish(`changed the VA profile`, fields.join(' \u00b7 '))
        : finish('edited the VA profile');
    }

    case 'ended':
      return finish('ended the assignment');

    case 'review_generated':
      return finish('generated a performance review');

    case 'review_completed':
      return finish('completed the performance review');

    case 'review_deleted':
      return finish('deleted a performance review');

    case 'eod_submitted':
      return finish('submitted an end-of-day report');

    case 'eod_deleted':
      return finish('deleted an end-of-day report');

    case 'eod_compliance_checked':
      return finish('ran the end-of-day compliance check');

    case 'survey_dispatched':
      return finish('dispatched a satisfaction survey');

    case 'eod_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(`edited an end-of-day report: ${edit.fields}`, edit.detail ?? '')
        : finish('edited an end-of-day report');
    }

    case 'review_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(edit.headline, edit.detail ?? '')
        : finish('edited the performance review');
    }

    case 'review_regenerated': {
      const section = str(metadata['section']);
      return finish(
        section
          ? `regenerated the review ${section}`
          : 'regenerated part of the review'
      );
    }

    case 'review_exported':
      return finish('exported the review as PDF');

    case 'survey_created': {
      const type = pick(metadata, 'surveyType');
      return finish(
        type
          ? `created a ${humanEnum(type)} survey reminder`
          : 'created a survey reminder'
      );
    }

    case 'survey_updated': {
      const type = pick(metadata, 'surveyType');
      const edit = summariseChanges(changes);
      return edit
        ? finish(
            edit.headline,
            [type ? `${upperFirst(humanEnum(type))} survey` : null, edit.detail]
              .filter(Boolean)
              .join(' \u00b7 ')
          )
        : finish('edited a survey reminder');
    }

    case 'report_exported': {
      const labels: Record<string, string> = {
        work_entries: 'work entries',
        eod_submissions: 'end-of-day',
        performance: 'performance review',
        dispositions: 'rejections',
      };
      const report = str(metadata['report']) ?? '';
      const format = pick(metadata, 'format');
      const start = pick(metadata, 'startDate');
      const end = pick(metadata, 'endDate');
      const range = start || end ? `${start ?? '\u2026'} to ${end ?? '\u2026'}` : null;
      return finish(
        `exported the ${labels[report] ?? 'data'} report`,
        [format ? format.toUpperCase() : null, range]
          .filter(Boolean)
          .join(' \u00b7 ')
      );
    }
  }
  return null;
};
