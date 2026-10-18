import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ClientContact } from '@/store/types';
import { MailIcon, PencilIcon, PhoneIcon, Trash2Icon } from 'lucide-react';
import { nameInitials } from './config';

interface ContactCardProps {
  contact: ClientContact;
  mutating: boolean;
  confirmingDelete: boolean;
  onEmail: () => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function ContactCard({
  contact: c,
  mutating,
  confirmingDelete,
  onEmail,
  onEdit,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
}: ContactCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0 text-muted-foreground">
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
            onClick={onAskDelete}
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
      {confirmingDelete && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Delete this contact?
            </span>
            <Button
              variant="destructive"
              size="xs"
              className="h-7 gap-1 px-2 text-xs"
              disabled={mutating}
              onClick={onConfirmDelete}
            >
              Yes
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="h-7 gap-1 px-2 text-xs"
              onClick={onCancelDelete}
            >
              No
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
