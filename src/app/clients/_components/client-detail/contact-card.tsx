import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ClientContact } from '@/store/types';
import { MailIcon, PencilIcon, PhoneIcon, Trash2Icon } from 'lucide-react';
import { avatarBg } from '../clients-table/client-avatar-utils';
import { nameInitials } from './config';

interface ContactCardProps {
  contact: ClientContact;
  mutating: boolean;
  onEmail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactCard({
  contact: c,
  mutating,
  onEmail,
  onEdit,
  onDelete,
}: ContactCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden
            style={{ backgroundColor: avatarBg(c.name) }}
            className="size-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 text-white"
          >
            {nameInitials(c.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {c.name}
            </p>
            {c.position && (
              <p className="text-xs text-muted-foreground truncate">
                {c.position}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {c.isPrimary && (
            <Badge
              variant="outline"
              className="text-xs h-6 px-2 border-pine-teal-600/50 text-pine-teal-700 dark:border-pine-teal-400/50 dark:text-pine-teal-300"
            >
              Primary
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
            onClick={onEmail}
            aria-label={`Email ${c.name}`}
          >
            <MailIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            aria-label={`Edit contact ${c.name}`}
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={mutating}
            onClick={onDelete}
            aria-label={`Delete contact ${c.name}`}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <a
          href={`mailto:${c.email}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MailIcon className="size-4 shrink-0" />
          <span className="truncate">{c.email}</span>
        </a>
        {c.phone && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <PhoneIcon className="size-4 shrink-0" />
            {c.phone}
          </span>
        )}
      </div>
    </div>
  );
}
