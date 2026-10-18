import { Separator } from '@/components/ui/separator';
import type { Client } from '@/store/types';
import {
  BuildingIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Dash, InfoRow, SectionTitle } from './primitives';
import { UserCell } from './user-cell';

export function OverviewTab({ client }: { client: Client }) {
  const shortAddress = client.address
    ? [client.address.city, client.address.state, client.address.country]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <div className="flex flex-col gap-6 py-5">
      <div className="flex flex-col gap-4">
        <SectionTitle>Contact Info</SectionTitle>
        <InfoRow icon={<MailIcon className="size-4" />} label="Email">
          <a
            href={`mailto:${client.email}`}
            className="underline underline-offset-4 decoration-border hover:text-primary transition-colors break-all"
          >
            {client.email}
          </a>
        </InfoRow>
        <InfoRow icon={<PhoneIcon className="size-4" />} label="Phone">
          {client.phone || <Dash />}
        </InfoRow>
        <InfoRow icon={<GlobeIcon className="size-4" />} label="Website">
          {client.website ? (
            <a
              href={
                client.website.startsWith('http')
                  ? client.website
                  : `https://${client.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 decoration-border hover:text-primary transition-colors"
            >
              {client.website}
            </a>
          ) : (
            <Dash />
          )}
        </InfoRow>
        <InfoRow icon={<MapPinIcon className="size-4" />} label="Address">
          {shortAddress || <Dash />}
        </InfoRow>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <SectionTitle>Company</SectionTitle>
        <InfoRow icon={<BuildingIcon className="size-4" />} label="Industry">
          {client.industry ? (
            client.industry.charAt(0).toUpperCase() + client.industry.slice(1)
          ) : (
            <Dash />
          )}
        </InfoRow>
        <InfoRow icon={<UserIcon className="size-4" />} label="Company Size">
          {client.companySize ? `${client.companySize} employees` : <Dash />}
        </InfoRow>
        {client.description && (
          <InfoRow
            icon={<BuildingIcon className="size-4" />}
            label="Description"
          >
            <span className="leading-relaxed break-words whitespace-pre-wrap">
              {client.description}
            </span>
          </InfoRow>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <SectionTitle>Record Info</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm">{formatDate(client.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="text-sm">{formatDate(client.updatedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created by</p>
            <UserCell userId={client.createdBy} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Updated by</p>
            <UserCell userId={client.updatedBy} />
          </div>
        </div>
      </div>
    </div>
  );
}
