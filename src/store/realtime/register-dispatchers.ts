import { resyncAllData } from '../../lib/resync';
import { useApplicationStore } from '../slices/applications.store';
import { useCandidateStore } from '../slices/candidates.store';
import { useClientStore } from '../slices/clients.store';
import { useEmailTemplateStore } from '../slices/email-templates.store';
import { useEmailStore } from '../slices/emails.store';
import { useInterviewScorecardStore } from '../slices/interview-scorecards.store';
import { useInterviewStore } from '../slices/interviews.store';
import { useJobStore } from '../slices/jobs.store';
import { usePipelineTemplateStore } from '../slices/pipeline-templates.store';
import { useTagStore } from '../slices/tags.store';
import { useUserStore } from '../slices/users.store';
import { socketManager } from './socket';

socketManager.register('tag', {
  _patch: useTagStore.getState()._patch,
  _remove: useTagStore.getState()._remove,
});
// Deleting a candidate also deletes its applications, interviews and emails on
// the server and only `candidate:deleted` is emitted, so clear the dependants
// here — otherwise other users keep orphaned rows until they reload.
socketManager.register('candidate', {
  _patch: useCandidateStore.getState()._patch,
  _remove: id => {
    useCandidateStore.getState()._remove(id);
    useApplicationStore.getState()._removeByCandidateId(id);
    useInterviewStore.getState()._removeByCandidateId(id);
    useEmailStore.getState()._removeByCandidateId(id);
  },
});
// Same cleanup the deleting user's own store does for a job / client.
socketManager.register('job', {
  _patch: useJobStore.getState()._patch,
  _remove: id => {
    useJobStore.getState()._remove(id);
    useApplicationStore.getState()._removeByJobId(id);
  },
});
socketManager.register('application', {
  _patch: useApplicationStore.getState()._patch,
  _remove: useApplicationStore.getState()._remove,
});
socketManager.register('interview', {
  _patch: useInterviewStore.getState()._patch,
  _remove: useInterviewStore.getState()._remove,
});
socketManager.register('client', {
  _patch: useClientStore.getState()._patch,
  _remove: id => {
    useClientStore.getState()._remove(id);
    useJobStore.getState()._removeByClientId(id);
    useApplicationStore.getState()._removeByClientId(id);
  },
});
socketManager.register('pipeline_template', {
  _patch: usePipelineTemplateStore.getState()._patch,
  _remove: usePipelineTemplateStore.getState()._remove,
});
socketManager.register('email_template', {
  _patch: useEmailTemplateStore.getState()._patch,
  _remove: useEmailTemplateStore.getState()._remove,
});
socketManager.register('email', {
  _patch: useEmailStore.getState()._patch,
});
socketManager.register('user', {
  _patch: useUserStore.getState()._patch,
  _remove: useUserStore.getState()._remove,
});
socketManager.register('interview_scorecard', {
  _patch: useInterviewScorecardStore.getState()._patch,
});
socketManager.registerResync(resyncAllData);
