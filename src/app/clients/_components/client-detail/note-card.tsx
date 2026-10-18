import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUserStore } from '@/store';
import type { ClientNote } from '@/store/types';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { formatDate, noteMethodConfig } from './config';

function NoteAuthor({ authorId }: { authorId?: string }) {
  const users = useUserStore(s => s.items);
  const fetchUsers = useUserStore(s => s.fetch);

  useEffect(() => {
    if (users.length === 0) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authorId) return 'Unknown';

  const user = users.find(u => u._id === authorId);
  if (user) return `${user.firstName} ${user.lastName}`;

  return authorId;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  mutating,
}: {
  note: ClientNote;
  onEdit: () => void;
  onDelete: () => void;
  mutating: boolean;
}) {
  const method = noteMethodConfig[note.method];
  const date = formatDate(note.createdAt);
  const authorName = <NoteAuthor authorId={note.author} />;

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0 text-muted-foreground">
            {method.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {authorName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="text-xs h-6 px-2 border-pine-teal-600/50 text-pine-teal-700 dark:border-pine-teal-400/50 dark:text-pine-teal-300"
          >
            {method.label}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            aria-label="Edit note"
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={mutating}
            onClick={onDelete}
            aria-label="Delete note"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
      <Separator />
      <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
        {note.content}
      </p>
    </div>
  );
}
