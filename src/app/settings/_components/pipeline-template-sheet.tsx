import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { PipelineTemplate, StageShape } from '@/store/types';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  AwardIcon,
  BadgeIcon,
  BookmarkIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  ClipboardIcon,
  ClipboardListIcon,
  ClockIcon,
  FileCheckIcon,
  FileScanIcon,
  FileSearchIcon,
  FileTextIcon,
  FilterIcon,
  FlagIcon,
  GitPullRequestIcon,
  HandshakeIcon,
  HelpCircleIcon,
  HourglassIcon,
  InfoIcon,
  KanbanIcon,
  LayersIcon,
  ListIcon,
  MailIcon,
  MessageSquareIcon,
  MicIcon,
  PaperclipIcon,
  PhoneCallIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TagIcon,
  TargetIcon,
  ThumbsUpIcon,
  TimerIcon,
  Trash2Icon,
  TrophyIcon,
  UserCheckIcon,
  UserIcon,
  UserSearchIcon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardList: ClipboardListIcon,
  ClipboardCheck: ClipboardCheckIcon,
  FileText: FileTextIcon,
  FileSearch: FileSearchIcon,
  FileScan: FileScanIcon,
  FileCheck: FileCheckIcon,
  Phone: PhoneIcon,
  PhoneCall: PhoneCallIcon,
  Mail: MailIcon,
  MessageSquare: MessageSquareIcon,
  Video: VideoIcon,
  Mic: MicIcon,
  User: UserIcon,
  Users: UsersIcon,
  UserCheck: UserCheckIcon,
  UserSearch: UserSearchIcon,
  Handshake: HandshakeIcon,
  Star: StarIcon,
  Award: AwardIcon,
  Trophy: TrophyIcon,
  Target: TargetIcon,
  CheckCircle: CheckCircleIcon,
  ThumbsUp: ThumbsUpIcon,
  Clock: ClockIcon,
  Calendar: CalendarIcon,
  Timer: TimerIcon,
  Hourglass: HourglassIcon,
  ArrowRight: ArrowRightIcon,
  GitPullRequest: GitPullRequestIcon,
  Paperclip: PaperclipIcon,
  BookOpen: BookOpenIcon,
  Briefcase: BriefcaseIcon,
  Badge: BadgeIcon,
  Clipboard: ClipboardIcon,
  AlertCircle: AlertCircleIcon,
  Info: InfoIcon,
  HelpCircle: HelpCircleIcon,
  Flag: FlagIcon,
  Tag: TagIcon,
  Bookmark: BookmarkIcon,
  Search: SearchIcon,
  Filter: FilterIcon,
  Settings: SettingsIcon,
  LayoutKanban: KanbanIcon,
  List: ListIcon,
  Layers: LayersIcon,
};

const ICON_GROUPS = [
  {
    label: 'Review',
    icons: [
      'ClipboardList',
      'ClipboardCheck',
      'FileText',
      'FileSearch',
      'FileScan',
      'FileCheck',
    ],
  },
  {
    label: 'Comms',
    icons: ['Phone', 'PhoneCall', 'Mail', 'MessageSquare', 'Video', 'Mic'],
  },
  {
    label: 'People',
    icons: ['User', 'Users', 'UserCheck', 'UserSearch', 'Handshake'],
  },
  {
    label: 'Eval',
    icons: ['Star', 'Award', 'Trophy', 'Target', 'CheckCircle', 'ThumbsUp'],
  },
  {
    label: 'Process',
    icons: [
      'Clock',
      'Calendar',
      'Timer',
      'Hourglass',
      'ArrowRight',
      'GitPullRequest',
    ],
  },
  {
    label: 'Docs',
    icons: ['Paperclip', 'BookOpen', 'Briefcase', 'Badge', 'Clipboard'],
  },
  {
    label: 'Status',
    icons: ['AlertCircle', 'Info', 'HelpCircle', 'Flag', 'Tag', 'Bookmark'],
  },
  {
    label: 'Misc',
    icons: ['Search', 'Filter', 'Settings', 'LayoutKanban', 'List', 'Layers'],
  },
];

function StageIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = ICON_MAP[value] ?? FileTextIcon;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="size-8 rounded-md border border-input bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        title="Pick icon"
      >
        <Icon className="size-4 text-foreground" />
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-50 w-72 rounded-md border bg-popover shadow-md p-2 flex flex-col gap-1.5">
          {ICON_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs text-muted-foreground px-1 mb-0.5">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {group.icons.map(name => {
                  const Ic = ICON_MAP[name] ?? FileTextIcon;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => {
                        onChange(name);
                        setOpen(false);
                      }}
                      className={`size-7 rounded flex items-center justify-center transition-colors hover:bg-accent ${value === name ? 'bg-accent text-accent-foreground' : ''}`}
                    >
                      <Ic className="size-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: PipelineTemplate;
  /** Name of the template currently marked as default, or null if none. Used
   *  to warn the user when toggling the `isDefault` Switch that confirming the
   *  save will transfer the default status from that other template.
   */
  existingDefaultName?: string | null;
  onSave: (data: {
    name: string;
    description: string;
    isDefault: boolean;
    isActive: boolean;
    stages: StageShape[];
  }) => void;
};

let stageCounter = 100;

export function PipelineTemplateSheet({
  open,
  onOpenChange,
  template,
  existingDefaultName,
  onSave,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [stages, setStages] = useState<StageShape[]>([]);

  useEffect(() => {
    if (open) {
      setName(template?.name ?? '');
      setDescription(template?.description ?? '');
      setIsDefault(template?.isDefault ?? false);
      setIsActive(template?.isActive ?? true);
      setStages(template?.stages ? [...template.stages] : []);
    }
  }, [open, template]);

  function addStage() {
    stageCounter++;
    setStages(prev => [
      ...prev,
      {
        _id: `new-${stageCounter}`,
        name: '',
        color: '#6366f1',
        order: prev.length + 1,
        isActive: true,
        icon: 'FileText',
      },
    ]);
  }

  function removeStage(id: string) {
    setStages(prev =>
      prev.filter(s => s._id !== id).map((s, i) => ({ ...s, order: i + 1 }))
    );
  }

  function updateStage(id: string, patch: Partial<StageShape>) {
    setStages(prev => prev.map(s => (s._id === id ? { ...s, ...patch } : s)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      isDefault,
      isActive,
      stages,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[30vw] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            {template ? 'Edit Template' : 'New Pipeline Template'}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Standard Hiring"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-desc">Description</Label>
              <Textarea
                id="tpl-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe when to use this template..."
                className="resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Default template</p>
                <p className="text-xs text-muted-foreground">
                  Auto-applied to new jobs
                </p>
              </div>
              <Switch
                checked={isDefault}
                onCheckedChange={v => {
                  setIsDefault(v);
                  // A default must be active (server enforces this). Toggling
                  // default on also activates the template to keep the form
                  // state consistent with the backend invariant.
                  if (v) setIsActive(true);
                }}
              />
            </div>
            {isDefault && !template?.isDefault && existingDefaultName && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1 -mt-2 px-4">
                <AlertCircleIcon className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  Saving will replace <b>{existingDefaultName}</b> as the
                  default. New jobs will use this template instead.
                </span>
              </p>
            )}
            {isDefault && !template?.isDefault && !existingDefaultName && (
              <p className="text-xs text-muted-foreground -mt-2 px-4">
                This will be set as the only default template.
              </p>
            )}

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Available for selection when creating jobs
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isDefault}
              />
            </div>
            {isDefault && !isActive && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1 -mt-2 px-4">
                <AlertCircleIcon className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  A default template must remain active. Disable this by first
                  removing it as default.
                </span>
              </p>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>Stages</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={addStage}
                >
                  <PlusIcon className="size-3" /> Add stage
                </Button>
              </div>

              {stages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 border rounded-md">
                  No stages yet. Add one above.
                </p>
              )}

              <div className="flex flex-col gap-2">
                {stages.map((stage, i) => (
                  <div
                    key={stage._id}
                    className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30"
                  >
                    <span className="text-xs text-muted-foreground w-4 text-center shrink-0">
                      {i + 1}
                    </span>
                    <StageIconPicker
                      value={stage.icon}
                      onChange={v => updateStage(stage._id, { icon: v })}
                    />
                    <input
                      type="color"
                      value={stage.color}
                      onChange={e =>
                        updateStage(stage._id, { color: e.target.value })
                      }
                      className="size-8 rounded-md cursor-pointer border border-input bg-transparent p-0.5"
                      title="Stage color"
                    />
                    <Input
                      value={stage.name}
                      onChange={e =>
                        updateStage(stage._id, { name: e.target.value })
                      }
                      placeholder="Stage name"
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeStage(stage._id)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {template ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
