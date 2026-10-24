import { Building2Icon, ClipboardListIcon, ContactIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Client } from '@/store/types';
import { Dash, DetailRow, DetailSection } from './primitives';
import { UserCell } from './user-cell';

const linkCls =
  'underline underline-offset-4 decoration-border hover:text-primary transition-colors';

export function OverviewTab({ client }: { client: Client }) {
  const { address } = client;
  const addressLines = address
    ? [
        address.street,
        [address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(', '),
        address.country,
      ].filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-4 py-5">
      <DetailSection title="Contact" icon={ContactIcon}>
        <DetailRow label="Email">
          <a href={`mailto:${client.email}`} className={linkCls}>
            {client.email}
          </a>
        </DetailRow>
        <DetailRow label="Phone">
          {client.phone ? (
            <a href={`tel:${client.phone}`} className={linkCls}>
              {client.phone}
            </a>
          ) : (
            <Dash />
          )}
        </DetailRow>
        <DetailRow label="Website">
          {client.website ? (
            <a
              href={
                client.website.startsWith('http')
                  ? client.website
                  : `https://${client.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
            >
              {client.website}
            </a>
          ) : (
            <Dash />
          )}
        </DetailRow>
        <DetailRow label="Address">
          {addressLines.length ? (
            addressLines.map((line, i) => <div key={i}>{line}</div>)
          ) : (
            <Dash />
          )}
        </DetailRow>
      </DetailSection>

      <DetailSection title="Company" icon={Building2Icon}>
        <DetailRow label="Industry">
          {client.industry ? (
            <span className="capitalize">{client.industry}</span>
          ) : (
            <Dash />
          )}
        </DetailRow>
        <DetailRow label="Company size">
          {client.companySize ? `${client.companySize} employees` : <Dash />}
        </DetailRow>
        {client.description && (
          <DetailRow label="Description">
            <span className="whitespace-pre-wrap leading-relaxed">
              {client.description}
            </span>
          </DetailRow>
        )}
      </DetailSection>

      <DetailSection title="Record" icon={ClipboardListIcon}>
        <DetailRow label="Created">{formatDate(client.createdAt)}</DetailRow>
        <DetailRow label="Created by">
          <UserCell userId={client.createdBy} />
        </DetailRow>
        <DetailRow label="Last updated">{formatDate(client.updatedAt)}</DetailRow>
        <DetailRow label="Updated by">
          <UserCell userId={client.updatedBy} />
        </DetailRow>
      </DetailSection>
    </div>
  );
}
