import { TagsSelector } from '@/components/tags-selector';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getTagIds } from '@/lib/tags';
import { useClientStore, useTagStore } from '@/store';
import type { Client } from '@/store/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  clientFormSchema,
  COMPANY_SIZES,
  getClientFormDefaults,
  type ClientFormValues,
} from '../_utils/client-form';
import { AddressFields } from './new-client-sheet/address-fields';
import { FormField } from './new-client-sheet/form-field';
import { LogoPicker } from './new-client-sheet/logo-picker';
import { PrimaryContactFields } from './new-client-sheet/primary-contact-fields';
import { useSaveClient } from './new-client-sheet/use-save-client';

interface NewClientSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client?: Client;
}

const SECTION_LABEL =
  'text-xs font-semibold text-muted-foreground uppercase tracking-wide -mb-1';

export function NewClientSheet({
  open,
  onOpenChange,
  client,
}: NewClientSheetProps) {
  const isEdit = !!client;
  const mutating = useClientStore(s => s.mutating);
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);

  const [tagIds, setTagIds] = useState<string[]>(getTagIds(client?.tags));
  const [logoPreview, setLogoPreview] = useState<string | null>(
    client?.logo ?? null
  );
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: getClientFormDefaults(client),
  });

  useEffect(() => {
    if (open) {
      void fetchTags();
      reset(getClientFormDefaults(client));
      setTagIds(getTagIds(client?.tags));
      setLogoPreview(client?.logo ?? null);
      setPendingLogoFile(null);
      setLogoRemoved(false);
    }
  }, [open, client, reset]);

  const save = useSaveClient(client, tagIds, pendingLogoFile, logoRemoved, () =>
    onOpenChange(false)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEdit ? 'Edit Client' : 'New Client'}</SheetTitle>
          <SheetDescription className="sr-only">
            Client company details, primary contact and status.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={
            handleSubmit(
              save
            ) as unknown as React.FormEventHandler<HTMLFormElement>
          }
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <LogoPicker
              preview={logoPreview}
              initials={client?.companyName?.slice(0, 2).toUpperCase() ?? 'CO'}
              onSelect={file => {
                setLogoPreview(URL.createObjectURL(file));
                setPendingLogoFile(file);
                setLogoRemoved(false);
              }}
              onRemove={() => {
                setLogoPreview(null);
                setPendingLogoFile(null);
                setLogoRemoved(true);
              }}
            />

            <FormField
              label="Company Name *"
              error={errors.companyName?.message}
            >
              <Input
                placeholder="e.g. Acme Corp"
                {...register('companyName')}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email *" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  {...register('email')}
                />
              </FormField>
              <FormField label="Phone">
                <Input placeholder="+1 (555) 000-0000" {...register('phone')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Industry">
                <Input
                  placeholder="e.g. Technology"
                  {...register('industry')}
                />
              </FormField>
              <FormField label="Company Size">
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
                        {COMPANY_SIZES.map(s => (
                          <SelectItem key={s} value={s}>
                            {s} employees
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField
              label="Website"
              hint="Use the full URL starting with https:// (e.g. https://company.com)"
            >
              <Input
                placeholder="e.g. https://company.com"
                {...register('website')}
              />
            </FormField>

            {isEdit && (
              <FormField label="Status">
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
              </FormField>
            )}

            <FormField label="Description">
              <Textarea
                rows={3}
                placeholder="Brief description of the company..."
                {...register('description')}
              />
            </FormField>

            <FormField label="Tags">
              <TagsSelector
                allTags={allTags}
                selectedIds={tagIds}
                onChange={setTagIds}
              />
            </FormField>

            <Separator />
            <p className={SECTION_LABEL}>Address</p>
            <AddressFields register={register} />

            {!isEdit && (
              <>
                <Separator />
                <p className={SECTION_LABEL}>Primary Contact</p>
                <PrimaryContactFields register={register} errors={errors} />
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
