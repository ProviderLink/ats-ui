import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { socketManager } from './store/realtime/socket';
import { useApplicationStore } from './store/slices/applications.store';
import { useCandidateStore } from './store/slices/candidates.store';
import { useClientStore } from './store/slices/clients.store';
import { useEmailTemplateStore } from './store/slices/email-templates.store';
import { useEmailStore } from './store/slices/emails.store';
import { useInterviewStore } from './store/slices/interviews.store';
import { useJobStore } from './store/slices/jobs.store';
import { usePipelineTemplateStore } from './store/slices/pipeline-templates.store';
import { useTagStore } from './store/slices/tags.store';

// Register store dispatchers for real-time events
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
);
