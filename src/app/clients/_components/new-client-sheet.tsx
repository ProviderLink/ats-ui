'use client';

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
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { logOptimisticActivity } from '@/lib/activity';
import { getTagIds } from '@/lib/tags';
import { useClientStore, useTagStore } from '@/store';
import type { Client, CreateClientDto, UpdateClientDto } from '@/store/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { CameraIcon, Loader2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// ─── Schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  companyName: z.string().min(1, 'Required').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  companySize: z
    .enum(['1-10', '11-50', '51-200', '201-500', '500+'])
    .optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  description: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  // Primary contact fields (create mode only — added to client via addContact API)
  contactName: z.string().optional(),
  contactEmail: z
    .string()
    .email('Invalid contact email')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string().optional(),
  contactPosition: z.string().optional(),
});

const VALID_COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

function sanitizeCompanySize(
  v?: string
): (typeof VALID_COMPANY_SIZES)[number] | undefined {
  if (!v) return undefined;
  if (v === '1-50') return '11-50';
  return (VALID_COMPANY_SIZES as readonly string[]).includes(v)
    ? (v as (typeof VALID_COMPANY_SIZES)[number])
    : undefined;
}

type FormValues = z.infer<typeof schema>;

// ─── Props ─────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client?: Client;
};

// ─── Field wrapper ─────────────────────────────────────────────────────────

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function NewClientSheet({ open, onOpenChange, client }: Props) {
  const isEdit = !!client;
  const create = useClientStore(s => s.create);
  const update = useClientStore(s => s.update);
  const uploadLogo = useClientStore(s => s.uploadLogo);
  const addContact = useClientStore(s => s.addContact);
  const mutating = useClientStore(s => s.mutating);
  const { items: allTags, fetch: fetchTags } = useTagStore();

  const [tagIds, setTagIds] = useState<string[]>(getTagIds(client?.tags));

  const [logoPreview, setLogoPreview] = useState<string | null>(
    client?.logo ?? null
  );
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: client
      ? {
          companyName: client.companyName,
          email: client.email,
          phone: client.phone ?? '',
          website: client.website ?? '',
          industry: client.industry ?? '',
          companySize: sanitizeCompanySize(
            client.companySize
          ) as FormValues['companySize'],
          status: client.status as FormValues['status'],
          description: client.description ?? '',
          address: client.address ?? {},
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          contactPosition: '',
        }
      : {
          address: {},
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          contactPosition: '',
        },
  });

  // Reset form when client changes (open different client for edit)
  useEffect(() => {
    if (open) {
      void fetchTags();
      reset(
        client
          ? {
              companyName: client.companyName,
              email: client.email,
              phone: client.phone ?? '',
              website: client.website ?? '',
              industry: client.industry ?? '',
              companySize: sanitizeCompanySize(
                client.companySize
              ) as FormValues['companySize'],
              status: client.status as FormValues['status'],
              description: client.description ?? '',
              address: client.address ?? {},
              contactName: '',
              contactEmail: '',
              contactPhone: '',
              contactPosition: '',
            }
          : {
              address: {},
              contactName: '',
              contactEmail: '',
              contactPhone: '',
              contactPosition: '',
            }
      );
      setTagIds(getTagIds(client?.tags));
      setLogoPreview(client?.logo ?? null);
      setPendingLogoFile(null);
    }
  }, [open, client, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && client) {
        const {
          contactName,
          contactEmail,
          contactPhone,
          contactPosition,
          ...clientData
        } = values;
        const payload: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(clientData)) {
          if (v === undefined) continue;
          if (k === 'address' && v && typeof v === 'object') {
            const addr: Record<string, unknown> = {};
            for (const [ak, av] of Object.entries(v)) {
              if (av) addr[ak] = av;
            }
            payload.address = addr;
          } else if (v === '') {
            payload[k] = '';
          } else {
            payload[k] = v;
          }
        }
        await update(client._id, {
          ...(payload as UpdateClientDto),
          tags: tagIds,
        });
        if (pendingLogoFile) await uploadLogo(client._id, pendingLogoFile);
        logOptimisticActivity(
          'client',
          client._id,
          'updated',
          `Updated client ${client.companyName}`
        );
        toast.success(`Client "${client.companyName}" updated`);
      } else {
        // 1. Create the client
        const {
          contactName,
          contactEmail,
          contactPhone,
          contactPosition,
          ...clientData
        } = values;
        const newClient = await create({
          ...clientData,
          tags: tagIds,
        } as CreateClientDto);
        if (pendingLogoFile) await uploadLogo(newClient._id, pendingLogoFile);

        // 2. Add primary contact if provided (client must have at least one)
        if (contactName?.trim() && contactEmail?.trim()) {
          await addContact(newClient._id, {
            name: contactName.trim(),
            email: contactEmail.trim(),
            phone: contactPhone?.trim() || undefined,
            position: contactPosition?.trim() || undefined,
            isPrimary: true,
          });
        }

        logOptimisticActivity(
          'client',
          newClient._id,
          'created',
          `Created client ${newClient.companyName}`
        );
        toast.success(`Client "${newClient.companyName}" created`);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(
        (e as Error).message ||
          (isEdit ? 'Failed to update client' : 'Failed to create client')
      );
    }
  }

  const initials = client?.companyName?.slice(0, 2).toUpperCase() ?? 'CO';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEdit ? 'Edit Client' : 'New Client'}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={
            handleSubmit(
              onSubmit
            ) as unknown as React.FormEventHandler<HTMLFormElement>
          }
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Logo upload */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative size-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload company logo"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <CameraIcon className="size-4 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoPreview(URL.createObjectURL(file));
                    setPendingLogoFile(file);
                  }
                }}
              />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Company Logo</p>
                <p className="text-xs text-muted-foreground">
                  Click to upload (PNG, JPG, SVG)
                </p>
                {logoPreview && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline text-left"
                    onClick={() => {
                      setLogoPreview(null);
                      setPendingLogoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <Field label="Company Name *" error={errors.companyName?.message}>
              <Input
                placeholder="e.g. Acme Corp"
                {...register('companyName')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email *" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  {...register('email')}
                />
              </Field>
              <Field label="Phone">
                <Input placeholder="+1 (555) 000-0000" {...register('phone')} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Industry">
                <Input
                  placeholder="e.g. Technology"
                  {...register('industry')}
                />
              </Field>
              <Field label="Company Size">
                <Controller
                  control={control}
                  name="companySize"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={v => field.onChange(v || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          [
                            '1-10',
                            '11-50',
                            '51-200',
                            '201-500',
                            '500+',
                          ] as const
                        ).map(s => (
                          <SelectItem key={s} value={s}>
                            {s} employees
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <Field
              label="Website"
              hint="Use the full URL starting with https:// (e.g. https://company.com)"
            >
              <Input
                placeholder="e.g. https://company.com"
                {...register('website')}
              />
            </Field>

            {isEdit && (
              <Field label="Status">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={v => field.onChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}

            <Field label="Description">
              <textarea
                rows={3}
                placeholder="Brief description of the company..."
                {...register('description')}
                className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring resize-none dark:bg-input/30"
              />
            </Field>

            <Field label="Tags">
              <TagsSelector
                allTags={allTags}
                selectedIds={tagIds}
                onChange={setTagIds}
              />
            </Field>

            <Separator />

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-1">
              Address
            </p>

            <Field label="Street">
              <Input
                placeholder="123 Main St"
                {...register('address.street')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="City">
                <Input
                  placeholder="e.g. New York"
                  {...register('address.city')}
                />
              </Field>
              <Field label="State">
                <Input placeholder="e.g. NY" {...register('address.state')} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Country">
                <Input
                  placeholder="e.g. USA"
                  {...register('address.country')}
                />
              </Field>
              <Field label="Postal Code">
                <Input
                  placeholder="e.g. 10001"
                  {...register('address.postalCode')}
                />
              </Field>
            </div>

            {!isEdit && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-1">
                  Primary Contact
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Contact Name"
                    error={errors.contactName?.message}
                  >
                    <Input
                      placeholder="e.g. Sarah Johnson"
                      {...register('contactName')}
                    />
                  </Field>
                  <Field
                    label="Contact Position"
                    error={errors.contactPosition?.message}
                  >
                    <Input
                      placeholder="e.g. HR Director"
                      {...register('contactPosition')}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Contact Email"
                    error={errors.contactEmail?.message}
                  >
                    <Input
                      type="email"
                      placeholder="sarah@company.com"
                      {...register('contactEmail')}
                    />
                  </Field>
                  <Field
                    label="Contact Phone"
                    error={errors.contactPhone?.message}
                  >
                    <Input
                      placeholder="+1 (555) 000-0000"
                      {...register('contactPhone')}
                    />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  This contact will be added as the primary contact. You can
                  manage it later in the Contacts tab.
                </p>
              </>
            )}
          </div>

          <SheetFooter className="border-t px-6 py-4 gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={mutating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
              disabled={mutating}
            >
              {mutating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Add Client'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
