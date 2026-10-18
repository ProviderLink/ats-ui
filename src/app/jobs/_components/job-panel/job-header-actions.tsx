import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckIcon, LinkIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

interface JobHeaderActionsProps {
  jobId: string;
  jobTitle: string;
  onDelete: () => void;
  onEdit: () => void;
}

export function JobHeaderActions({
  jobId,
  jobTitle,
  onDelete,
  onEdit,
}: JobHeaderActionsProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/careers/${jobId}`
    );
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <div className="relative flex items-center gap-2 shrink-0 pt-0.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
              onClick={onDelete}
              aria-label={`Delete job ${jobTitle}`}
            >
              <Trash2Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete job</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={onEdit}
              aria-label={`Edit job ${jobTitle}`}
            >
              <PencilIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit job</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
              onClick={copyLink}
              aria-label={linkCopied ? 'Job link copied' : 'Copy link to job'}
            >
              {linkCopied ? (
                <CheckIcon className="text-green-600" />
              ) : (
                <LinkIcon />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {linkCopied ? 'Copied!' : 'Copy public job link'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
