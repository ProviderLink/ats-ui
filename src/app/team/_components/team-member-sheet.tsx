import { ActivityTimeline } from '@/components/activity-timeline';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/store/types/user.types';
import { MEMBER_ACTIVITY_FILTERS } from '../_utils/member-activity-filters';
import { AccessTab } from './team-member-sheet/access-tab';
import { MemberHeader } from './team-member-sheet/member-header';
import { OverviewTab } from './team-member-sheet/overview-tab';

interface TeamMemberSheetProps {
  member: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (member: User) => void;
}

export function TeamMemberSheet({
  member,
  open,
  onOpenChange,
  onEdit,
}: TeamMemberSheetProps) {
  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 w-full sm:max-w-md"
      >
        <SheetHeader className="gap-4 px-6 pt-6 pb-4">
          <SheetTitle className="sr-only">Member details</SheetTitle>
          <SheetDescription className="sr-only">
            Team member profile, access and activity.
          </SheetDescription>
          <MemberHeader
            member={member}
            onEdit={() => {
              onOpenChange(false);
              onEdit(member);
            }}
          />
        </SheetHeader>

        <Tabs defaultValue="overview" className="min-h-0 flex-1 gap-0">
          <TabsList variant="line" className="w-full justify-start px-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="overview" className="divide-y">
              <OverviewTab member={member} />
            </TabsContent>

            <TabsContent value="access" className="flex flex-col gap-5">
              <AccessTab member={member} />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityTimeline
                resourceType="user"
                resourceId={member._id}
                filters={MEMBER_ACTIVITY_FILTERS}
                compact
              />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
