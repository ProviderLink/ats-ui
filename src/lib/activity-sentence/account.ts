import {
  str,
  strArray,
  humanKey,
} from './format';
import { summariseChanges } from './changes';
import type { SentenceHandler } from './scope';

export const describeAccount: SentenceHandler = ({ key, metadata, changes, finish, impersonal }) => {
  switch (key) {
    case 'permissions_updated': {
      const resources = strArray(metadata['resources']).map(r =>
        humanKey(r).toLowerCase()
      );
      return resources.length > 0
        ? finish(`changed permissions`, resources.join(' \u00b7 '))
        : finish('changed permissions');
    }

    case 'provisioned_va':
      return finish('granted CRM portal access');

    case 'provisioned_client':
      return finish('provisioned a client account');

    case 'revoked_crm':
      return finish('revoked CRM portal access');

    case 'deactivated':
      return finish('deactivated this account');

    case 'login': {
      // The IP is stored for investigations but kept off the row: a long list
      // of sign-ins is easier to scan one line each.
      const app = str(metadata['app']);
      return finish(app ? `signed in to the ${app.toUpperCase()}` : 'signed in');
    }

    case 'login_failed': {
      const app = str(metadata['app']);
      const reason = str(metadata['reason']);
      const ip = str(metadata['ip']);
      const parts = [
        app ? app.toUpperCase() : null,
        reason === 'inactive'
          ? 'account deactivated'
          : reason === 'wrong_password'
            ? 'wrong password'
            : null,
        ip,
      ].filter(Boolean);
      return impersonal('failed sign-in attempt', parts.join(' \u00b7 '));
    }

    case 'password_changed':
      return finish('changed their password');

    case 'password_reset':
      return finish('reset their password');

    case 'invite_accepted':
      return finish('accepted the invitation and set a password');

    case 'settings_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(edit.headline, edit.detail ?? '')
        : finish('changed workspace settings');
    }
  }
  return null;
};
