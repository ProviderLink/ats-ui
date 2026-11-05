import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Client } from "@/store/types";
import type { CSSProperties } from "react";
import { ClientIdentity } from "./client-detail/client-identity";
import { ClientTabs } from "./client-detail/client-tabs";
import { ClientTagsBar } from "./client-detail/client-tags-bar";
import { SheetHeaderActions } from "./client-detail/sheet-header-actions";
import { useClientCrmAccess } from "./client-detail/use-client-crm-access";

// A fine grid in the theme colour that fades out towards the bottom left.
const GRID_LINE = "color-mix(in oklab, var(--primary) 14%, transparent)";
const GRID_FADE =
  "radial-gradient(120% 130% at 100% 0%, black 15%, transparent 72%)";
const HEADER_PATTERN: CSSProperties = {
  backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
  backgroundSize: "22px 22px",
  maskImage: GRID_FADE,
  WebkitMaskImage: GRID_FADE,
};

interface ClientDetailSheetProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export function ClientDetailSheet({ client, ...rest }: ClientDetailSheetProps) {
  // The null check deliberately sits OUTSIDE the hooks. `client` is derived from
  // the live store array by the caller, so it can become null while the sheet is
  // already mounted — e.g. another user deletes the client and the
  // `client:deleted` socket event patches it out of `items`. Returning null from
  // a component that had already mounted its hooks crashed React with
  // "Rendered fewer hooks than expected", so the hooks live in a child that is
  // only ever rendered with a real client.
  if (!client) return null;
  return <ClientDetailSheetContent client={client} {...rest} />;
}

interface ContentProps extends Omit<ClientDetailSheetProps, "client"> {
  client: Client;
}

function ClientDetailSheetContent({
  client,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ContentProps) {
  const crm = useClientCrmAccess(client, open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 w-full sm:!max-w-[500px]"
      >
        <SheetHeader className="relative shrink-0 gap-0 overflow-hidden border-b p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={HEADER_PATTERN}
          />
          <div className="relative flex flex-col gap-4">
            <SheetTitle className="sr-only">{client.companyName}</SheetTitle>
            <SheetDescription className="sr-only">
              Client company details, contacts, jobs and activity.
            </SheetDescription>
            <ClientIdentity client={client} />
            <ClientTagsBar client={client} open={open} />
            <SheetHeaderActions
              canProvision={crm.canProvision}
              crmUser={crm.crmUser}
              busy={crm.busy}
              onProvision={crm.provision}
              onRevoke={crm.revoke}
              onEdit={
                onEdit &&
                (() => {
                  onOpenChange(false);
                  onEdit(client);
                })
              }
              onDelete={
                onDelete &&
                (() => {
                  onOpenChange(false);
                  onDelete(client);
                })
              }
            />
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <ClientTabs client={client} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
