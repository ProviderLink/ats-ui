import { TagsSelector } from '@/components/tags-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { logOptimisticActivity } from '@/lib/activity';
import { getTagIds } from '@/lib/tags';
import { cn } from '@/lib/utils';
import type {
  Client,
  CreateJobDto,
  Job,
  SalaryPeriod,
  UpdateJobDto,
} from '@/store';
import {
  useClientStore,
  useJobStore,
  usePipelineTemplateStore,
  useTagStore,
} from '@/store';
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function ClientCombobox({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = clients.find(c => c._id === value);
  const filtered = search.trim()
    ? clients.filter(c =>
        c.companyName.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setSearch('');
  }

  function handleToggle() {
    setOpen(o => {
      if (!o) setTimeout(() => inputRef.current?.focus(), 30);
      else setSearch('');
      return !o;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between h-9 px-3 rounded-md border bg-background text-sm ring-offset-background',
          'hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          !selected && 'text-muted-foreground'
        )}
      >
        <span className="truncate">
          {selected?.companyName ?? 'Select client'}
        </span>
        <ChevronDownIcon
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground ml-2 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md">
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            {search && (
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  setSearch('');
                }}
                className="text-muted-foreground/50 hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <div
            style={{ maxHeight: '200px', overflowY: 'scroll' }}
            className="py-1"
          >
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clients found
              </p>
            ) : (
              filtered.map(c => (
                <button
                  key={c._id}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleSelect(c._id);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left',
                    value === c._id && 'bg-accent/50'
                  )}
                >
                  <CheckIcon
                    className={cn(
                      'size-3.5 shrink-0',
                      value === c._id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{c.companyName}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && (
          <span className="text-destructive text-xs leading-none">*</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function DynamicList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/50 w-4 text-right shrink-0 tabular-nums select-none">
            {i + 1}.
          </span>
          <Input
            value={item}
            onChange={e => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="shrink-0 text-muted-foreground/40 hover:text-destructive"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground mt-0.5"
        onClick={() => onChange([...items, ''])}
      >
        <PlusIcon className="size-3.5" />
        Add item
      </Button>
    </div>
  );
}

function SkillsInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addSkill(raw: string) {
    const trimmed = raw.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === 'Backspace' && !input && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-background min-h-9 cursor-text"
      onClick={() => document.getElementById('skills-input')?.focus()}
    >
      {skills.map(s => (
        <span
          key={s}
          className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded border border-border/60"
        >
          {s}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onChange(skills.filter(x => x !== s));
            }}
            className="text-muted-foreground/50 hover:text-destructive"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        id="skills-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addSkill(input);
        }}
        placeholder={skills.length === 0 ? 'Type skill + Enter or comma' : ''}
        className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job?: Job;
  clients?: Client[];
};

export function NewJobSheet({
  open,
  onOpenChange,
  job,
  clients: clientsProp,
}: Props) {
  const isEdit = !!job;

  const { create, update, mutating } = useJobStore();
  const { items: storeClients, fetch: fetchClients } = useClientStore();
  const { items: tags, fetch: fetchTags } = useTagStore();
  const { items: pipelineTemplates, fetch: fetchPipelines } =
    usePipelineTemplateStore();

  const clients = clientsProp ?? storeClients;

  useEffect(() => {
    if (open) {
      if (clients.length === 0) void fetchClients();
      void fetchTags();
      void fetchPipelines();
    }
  }, [open]);

  const activePipelines = pipelineTemplates.filter(p => p.isActive);
  const defaultPipelineId =
    activePipelines.find(p => p.isDefault)?._id ??
    activePipelines[0]?._id ??
    '';

  const [title, setTitle] = useState(job?.title ?? '');
  const [clientId, setClientId] = useState(job?.clientId ?? '');
  const [pipelineId, setPipelineId] = useState(
    job?.pipeline?.templateId ?? defaultPipelineId
  );
  const [jobType, setJobType] = useState(job?.jobType ?? '');
  const [locationType, setLocationType] = useState(job?.locationType ?? '');
  const [location, setLocation] = useState(job?.location ?? '');
  const [experienceLevel, setExperienceLevel] = useState(
    job?.experienceLevel ?? ''
  );
  const [priority, setPriority] = useState<string>(job?.priority ?? 'medium');
  const [openings, setOpenings] = useState(String(job?.openings ?? 1));
  const [applicationDeadline, setApplicationDeadline] = useState(
    job?.applicationDeadline ? job.applicationDeadline.slice(0, 10) : ''
  );
  const [startDate, setStartDate] = useState(
    job?.startDate ? job.startDate.slice(0, 10) : ''
  );
  const [salaryMin, setSalaryMin] = useState(
    String(job?.salaryRange?.min ?? '')
  );
  const [salaryMax, setSalaryMax] = useState(
    String(job?.salaryRange?.max ?? '')
  );
  const [currency, setCurrency] = useState(job?.salaryRange?.currency ?? 'USD');
  const [salaryPeriod, setSalaryPeriod] = useState(
    job?.salaryRange?.period ?? ''
  );
  const [description, setDescription] = useState(job?.description ?? '');
  const [requirements, setRequirements] = useState<string[]>(
    job?.requirements?.length ? job.requirements : ['']
  );
  const [responsibilities, setResponsibilities] = useState<string[]>(
    job?.responsibilities?.length ? job.responsibilities : ['']
  );
  const [skills, setSkills] = useState<string[]>(job?.skills ?? []);
  const [tagIds, setTagIds] = useState<string[]>(getTagIds(job?.tags));
  const [benefits, setBenefits] = useState<string[]>(job?.benefits ?? []);

  useEffect(() => {
    if (!open) return;
    if (!pipelineId && defaultPipelineId) setPipelineId(defaultPipelineId);
  }, [open, defaultPipelineId]);

  const selectedPipeline = activePipelines.find(p => p._id === pipelineId);

  async function handleSubmit() {
    const salaryRange =
      salaryMin && salaryMax && salaryPeriod
        ? {
            min: Number(salaryMin),
            max: Number(salaryMax),
            currency,
            period: salaryPeriod as SalaryPeriod,
          }
        : undefined;

    const dto = {
      title: title.trim(),
      description: description.trim(),
      clientId,
      pipelineId: pipelineId || undefined,
      jobType: jobType as CreateJobDto['jobType'],
      locationType: locationType as CreateJobDto['locationType'],
      location: location.trim() || undefined,
      experienceLevel: experienceLevel as CreateJobDto['experienceLevel'],
      priority: priority as CreateJobDto['priority'],
      openings: Number(openings) || 1,
      requirements: requirements.filter(Boolean),
      responsibilities: responsibilities.filter(Boolean),
      skills,
      tags: tagIds,
      benefits: benefits.filter(Boolean),
      salaryRange,
      applicationDeadline: applicationDeadline
        ? new Date(applicationDeadline).toISOString()
        : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
    };

    try {
      if (isEdit) {
        const { clientId: _cid, ...updateDto } = dto;
        await update(job!._id, updateDto as UpdateJobDto);
        logOptimisticActivity(
          'job',
          job!._id,
          'updated',
          `Job "${dto.title}" updated`
        );
        toast.success('Job updated');
      } else {
        const created = await create(dto as CreateJobDto);
        logOptimisticActivity(
          'job',
          created._id,
          'created',
          `Job "${dto.title}" created`
        );
        toast.success('Job created');
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(
        (e as Error).message ||
          (isEdit ? 'Failed to update job' : 'Failed to create job')
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEdit ? 'Edit Job' : 'New Job'}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <FormField label="Job Title" required>
            <Input
              placeholder="e.g. Senior Frontend Engineer"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </FormField>

          <FormField label="Client" required>
            <ClientCombobox
              clients={clients}
              value={clientId}
              onChange={setClientId}
            />
          </FormField>

          {/* Pipeline */}
          <div className="rounded-lg border bg-muted/30 dark:bg-white/[0.02] p-4 flex flex-col gap-3">
            <Label className="flex items-center gap-1 text-sm">
              Pipeline
              <span className="text-destructive text-xs leading-none">*</span>
            </Label>
            <Select value={pipelineId} onValueChange={setPipelineId}>
              <SelectTrigger className="bg-background w-full [&>[data-slot=select-value]]:truncate">
                <SelectValue placeholder="Select a pipeline" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)]">
                {activePipelines.map(p => (
                  <SelectItem key={p._id} value={p._id}>
                    <span className="truncate">
                      {p.name}
                      {p.isDefault ? ' (Default)' : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPipeline && (
              <div className="flex flex-col gap-2 pt-1 border-t">
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                  Stages
                </p>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
                  {selectedPipeline.stages
                    .filter(s => s.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map((stage, i, arr) => (
                      <span key={stage._id} className="flex items-center gap-1">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${stage.color}15`,
                            color: stage.color,
                          }}
                        >
                          {stage.name}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="text-[10px] text-muted-foreground/35">
                            →
                          </span>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Job Type" required>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Location Type" required>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Location">
            <Input
              placeholder="e.g. New York, NY (leave blank if remote)"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Experience Level" required>
              <Select
                value={experienceLevel}
                onValueChange={setExperienceLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Openings">
              <Input
                type="number"
                min={1}
                placeholder="1"
                value={openings}
                onChange={e => setOpenings(e.target.value)}
              />
            </FormField>
            <FormField label="Application Deadline">
              <Input
                type="date"
                value={applicationDeadline}
                onChange={e => setApplicationDeadline(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Start Date">
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Min Salary">
              <Input
                type="number"
                placeholder="e.g. 80000"
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value)}
              />
            </FormField>
            <FormField label="Max Salary">
              <Input
                type="number"
                placeholder="e.g. 110000"
                value={salaryMax}
                onChange={e => setSalaryMax(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Currency">
              <Input
                placeholder="USD"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              />
            </FormField>
            <FormField label="Salary Period">
              <Select value={salaryPeriod} onValueChange={setSalaryPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Description" required>
            <Textarea
              rows={4}
              placeholder="Job description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </FormField>

          <FormField label="Requirements">
            <DynamicList
              items={requirements}
              onChange={setRequirements}
              placeholder="e.g. 3+ years of React experience"
            />
          </FormField>

          <FormField label="Responsibilities">
            <DynamicList
              items={responsibilities}
              onChange={setResponsibilities}
              placeholder="e.g. Lead frontend architecture decisions"
            />
          </FormField>

          <FormField label="Skills">
            <SkillsInput skills={skills} onChange={setSkills} />
          </FormField>

          <FormField label="Tags">
            <TagsSelector
              allTags={tags}
              selectedIds={tagIds}
              onChange={setTagIds}
            />
          </FormField>

          <FormField label="Benefits">
            <DynamicList
              items={benefits}
              onChange={setBenefits}
              placeholder="e.g. Health insurance, 401k matching"
            />
          </FormField>
        </div>

        <SheetFooter className="border-t px-6 py-4 gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={mutating}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
            onClick={() => void handleSubmit()}
            disabled={
              mutating ||
              !title.trim() ||
              !clientId ||
              !jobType ||
              !locationType ||
              !experienceLevel ||
              !description.trim()
            }
          >
            {isEdit ? 'Save Changes' : 'Add Job'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
