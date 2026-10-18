import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useComposeEmail } from '../_hooks/use-compose-email';
import { composeModeTitle, type ComposeMode } from '../_utils/compose-mode';
import { AttachmentList } from './compose-email-sheet/attachment-list';
import { ComposeFooter } from './compose-email-sheet/compose-footer';
import { RecipientFields } from './compose-email-sheet/recipient-fields';
import { TemplateSelector } from './template-selector';

interface ComposeEmailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: ComposeMode;
}

export function ComposeEmailSheet({
  open,
  onOpenChange,
  mode = { type: 'new' },
}: ComposeEmailSheetProps) {
  const form = useComposeEmail(open, mode, () => onOpenChange(false));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        style={{ width: '44rem', maxWidth: '100vw' }}
        className="flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle className="text-base font-medium">
            {composeModeTitle(mode)}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Compose an email with recipients, subject and message.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template">Template</Label>
              <TemplateSelector
                value={form.templateId}
                onChange={form.changeTemplate}
                disabled={form.uploading}
              />
            </div>

            <RecipientFields
              to={form.to}
              cc={form.cc}
              bcc={form.bcc}
              showCc={form.showCc}
              showBcc={form.showBcc}
              toRef={form.toRef}
              ccRef={form.ccRef}
              bccRef={form.bccRef}
              onToChange={form.setTo}
              onCcChange={form.setCc}
              onBccChange={form.setBcc}
              onShowCopyFields={form.showBothCopyFields}
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject..."
                value={form.subject}
                onChange={e => form.setSubject(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Write your message here..."
                value={form.body}
                onChange={e => form.setBody(e.target.value)}
                className="min-h-64 resize-none leading-relaxed"
              />
            </div>

            <AttachmentList
              attachments={form.attachments}
              onRemove={form.removeAttachment}
            />
          </div>
        </div>

        <Separator />

        <ComposeFooter
          fileInputRef={form.fileInputRef}
          uploading={form.uploading}
          sending={form.mutating}
          onFiles={form.addFiles}
          onDiscard={() => onOpenChange(false)}
          onSend={form.submit}
        />
      </SheetContent>
    </Sheet>
  );
}
