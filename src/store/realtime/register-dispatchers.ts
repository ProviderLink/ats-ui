import { resyncAllData } from '../../lib/resync';
import { useApplicationStore } from '../slices/applications.store';
import { useCandidateStore } from '../slices/candidates.store';
import { useClientStore } from '../slices/clients.store';
import { useEmailTemplateStore } from '../slices/email-templates.store';
import { useEmailStore } from '../slices/emails.store';
import { useInterviewStore } from '../slices/interviews.store';
import { useJobStore } from '../slices/jobs.store';
import { usePipelineTemplateStore } from '../slices/pipeline-templates.store';
import { useTagStore } from '../slices/tags.store';
import { socketManager } from './socket';

socketManager.register('tag', {
  _patch: useTagStore.getState()._patch,
  _remove: useTagStore.getState()._remove,
});
socketManager.register('candidate', {
  _patch: useCandidateStore.getState()._patch,
  _remove: useCandidateStore.getState()._remove,
});
socketManager.register('job', {
  _patch: useJobStore.getState()._patch,
  _remove: useJobStore.getState()._remove,
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
  _remove: useClientStore.getState()._remove,
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
socketManager.registerResync(resyncAllData);
