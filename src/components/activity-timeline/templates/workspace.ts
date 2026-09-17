/**
 * Workspace rows: settings, tags, work entries, client CRM details, and team
 * account administration.
 *
 * These are properties of the workspace rather than of a person, so the
 * subject is impersonal (`Workspace settings updated`). The generic
 * created/updated/deleted rows for `tag` and `work_entry` land here too, via
 * the resourceType dispatch in `actions.ts`.
 */

import { changeFields } from '../changes';
import { listPhrase, sentenceCase } from '../format';
import { byActor, possessive, withQualifier } from '../grammar';
import { FIELD_PHRASE } from '../lexicon';
import { asStringArray, firstString, humanName } from '../narrowing';
import type { ActivityEntry, SentenceContext } from '../types';
import type { Template } from './types';

/** Singular noun for the thing a workspace row is about. */
function thing(entry: ActivityEntry): string {
  switch (entry.resourceType) {
    case 'tag':
      return 'tag';
    case 'work_entry':
      return 'work entry';
    case 'client_account':
      return 'client account';
    case 'settings':
      return 'workspace settings';
    default:
      return 'workspace item';
  }
}

/** Name of the person a team-admin action targets, when one is carried. */
function personName(entry: ActivityEntry): string | null {
  return humanName(
    firstString(entry.metadata, ['memberName', 'userName', 'name'])
  );
}

/** `notes, satisfaction score` from `metadata.fields`. */
function listedFields(entry: ActivityEntry): string | null {
  const raw = asStringArray(entry.metadata['fields']);
  if (!raw) return null;
  const phrases = raw
    .slice(0, 3)
    .map(field => FIELD_PHRASE[field] ?? sentenceCase(field).toLowerCase());
  return listPhrase(phrases, 3) || null;
}

/** `name, email` from a `changes` diff. */
function changedFields(entry: ActivityEntry): string | null {
  const fields = changeFields(asStringArray(entry.metadata['changes']) ?? []);
  return listPhrase(fields, 3) || null;
}

/** A workspace row's optional extra context, from whichever key was written. */
function qualifier(entry: ActivityEntry): string | null {
  return (
    changedFields(entry) ??
    listedFields(entry) ??
    humanName(firstString(entry.metadata, ['label']))
  );
}

const settingsUpdated: Template = (entry, ctx) => {
  const extra = qualifier(entry);
  const noun = thing(entry);
  if (ctx.scope === 'entity') {
    return withQualifier(`${sentenceCase(noun)} updated${byActor(ctx)}`, extra);
  }
  // "updated the workspace settings" reads better than "updated the tag".
  const object =
    entry.resourceType === 'settings' ? `the ${noun}` : `a ${noun}`;
  return withQualifier(`${ctx.actorName} updated ${object}`, extra, ' — ');
};

const created: Template = (entry, ctx) => {
  const noun = thing(entry);
  if (ctx.scope === 'entity') return `Created${byActor(ctx)}`;
  const object =
    entry.resourceType === 'settings' ? `the ${noun}` : `a ${noun}`;
  return `${ctx.actorName} created ${object}`;
};

const updated: Template = (entry, ctx) => {
  const extra = qualifier(entry);
  const noun = thing(entry);
  if (ctx.scope === 'entity') {
    return withQualifier(`Updated${byActor(ctx)}`, extra);
  }
  const object =
    entry.resourceType === 'settings' ? `the ${noun}` : `a ${noun}`;
  return withQualifier(`${ctx.actorName} updated ${object}`, extra);
};

const deleted: Template = (entry, ctx) => {
  const noun = thing(entry);
  if (ctx.scope === 'entity') return `Deleted${byActor(ctx)}`;
  const object =
    entry.resourceType === 'settings' ? `the ${noun}` : `a ${noun}`;
  return `${ctx.actorName} deleted ${object}`;
};

const crmProfileUpdated: Template = (entry, ctx) => {
  const extra = changedFields(entry);
  if (ctx.scope === 'entity') {
    return withQualifier(`CRM profile updated${byActor(ctx)}`, extra);
  }
  const owner = ctx.entityName ?? 'a client';
  return withQualifier(
    `${ctx.actorName} updated ${possessive(owner)} CRM profile`,
    extra
  );
};

const clientAccountUpdated: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? `CRM account details updated${byActor(ctx)}`
    : `${ctx.actorName} updated the CRM account details for ${ctx.entityName ?? 'a client'}`;

/**
 * Team account administration. None of these writers pass `performedBy`, so
 * the actor resolves to `System` — which is why the sentences avoid a verb
 * that needs a definite subject.
 */
const target = (entry: ActivityEntry, ctx: SentenceContext): string =>
  personName(entry) ?? ctx.entityName ?? 'a team member';

const permissionsUpdated: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? `Permissions updated${byActor(ctx)}`
    : `${ctx.actorName} updated ${possessive(target(entry, ctx))} permissions`;

const provisionedVa: Template = (entry, ctx) => {
  const who = personName(entry);
  return ctx.scope === 'entity'
    ? `VA account provisioned${byActor(ctx)}`
    : `A VA account was provisioned${who ? ` for ${who}` : ''}`;
};

const provisionedClient: Template = (entry, ctx) => {
  const who = personName(entry);
  return ctx.scope === 'entity'
    ? `CRM account provisioned${byActor(ctx)}`
    : `A CRM account was provisioned${who ? ` for ${who}` : ''}`;
};

const revokedCrm: Template = (entry, ctx) => {
  const who = personName(entry);
  return ctx.scope === 'entity'
    ? `CRM access revoked${byActor(ctx)}`
    : `${ctx.actorName} revoked CRM access${who ? ` for ${who}` : ''}`;
};

const deactivated: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? `Deactivated${byActor(ctx)}`
    : `${ctx.actorName} deactivated ${target(entry, ctx)}`;

export const WORKSPACE_TEMPLATES: Record<string, Template> = {
  settings_updated: settingsUpdated,
  crm_profile_updated: crmProfileUpdated,
  crm_client_account_updated: clientAccountUpdated,
  permission_updated: permissionsUpdated,
  permissions_updated: permissionsUpdated,
  provisioned_va: provisionedVa,
  provisioned_client: provisionedClient,
  revoked_crm: revokedCrm,
  deactivated,
};

export const TAG_LIFECYCLE_TEMPLATES: Record<string, Template> = {
  created,
  updated,
  deleted,
};
