import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Client } from '@/store/types';
import { ActivityTab } from './activity-tab';
import { ContactsTab } from './contacts-tab';
import { CrmTab } from './crm-tab';
import { JobsTab } from './jobs-tab';
import { NotesTab } from './notes-tab';
import { OverviewTab } from './overview-tab';

export function ClientTabs({ client }: { client: Client }) {
  return (
    <Tabs defaultValue="overview">
      <div className="border-b px-6 py-3">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts
            {client.contacts.length > 0 && (
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[10px] rounded-full border-border"
              >
                {client.contacts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          {client.crmProfile && <TabsTrigger value="crm">CRM</TabsTrigger>}
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0 px-6">
        <OverviewTab client={client} />
      </TabsContent>
      <TabsContent value="contacts" className="mt-0 px-6">
        <ContactsTab clientId={client._id} contacts={client.contacts} />
      </TabsContent>
      <TabsContent value="jobs" className="mt-0 px-6">
        <JobsTab clientId={client._id} />
      </TabsContent>
      <TabsContent value="activity" className="mt-0 px-6">
        <ActivityTab clientId={client._id} />
      </TabsContent>
      <TabsContent value="notes" className="mt-0 px-6">
        <NotesTab clientId={client._id} />
      </TabsContent>
      {client.crmProfile && (
        <TabsContent value="crm" className="mt-0 px-6">
          <CrmTab clientId={client._id} crm={client.crmProfile} />
        </TabsContent>
      )}
    </Tabs>
  );
}
