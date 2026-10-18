import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store';
import {
  LayersIcon,
  ListFilterIcon,
  MailIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { AiSettingsCard } from '../_components/ai-settings-card';
import { ApplicationConfirmationCard } from '../_components/application-confirmation-card';
import { DispositionReasonsCard } from '../disposition-reasons/page';
import { EmailSettingsCard } from '../_components/email-settings-card';
import { EmailTemplatesCard } from '../_components/email-templates-card';
import { PipelineTemplatesCard } from '../_components/pipeline-templates-card';
import { WorkspaceCard } from '../_components/workspace-card';

export default function SettingsGeneralPage() {
  // The rejection-reason editor is admin-only, matching its own route guard,
  // because only admins may write to `/ats/disposition-reasons`.
  const isAdmin = useAuthStore(s => s.user?.roles.includes('admin') ?? false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div>
        <h1 className="text-base font-semibold">General Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace and pipeline configuration
        </p>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">
            <SlidersHorizontalIcon className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="pipelines">
            <LayersIcon className="size-4" />
            Pipeline Templates
          </TabsTrigger>
          <TabsTrigger value="emails">
            <MailIcon className="size-4" />
            Email Templates
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="rejection-reasons">
              <ListFilterIcon className="size-4" />
              Rejection Reasons
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="general" className="flex flex-col gap-6 mt-4">
          <WorkspaceCard />
          <EmailSettingsCard />
          <AiSettingsCard />
          <ApplicationConfirmationCard />
        </TabsContent>
        <TabsContent value="pipelines" className="mt-4">
          <PipelineTemplatesCard />
        </TabsContent>
        <TabsContent value="emails" className="mt-4">
          <EmailTemplatesCard />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="rejection-reasons" className="mt-4">
            <DispositionReasonsCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
