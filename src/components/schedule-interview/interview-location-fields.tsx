import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangleIcon, CheckIcon } from 'lucide-react';

interface InterviewLocationFieldsProps {
  type: string;
  meetingLink: string;
  onMeetingLinkChange: (value: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
}

export function InterviewLocationFields({
  type,
  meetingLink,
  onMeetingLinkChange,
  phoneNumber,
  onPhoneNumberChange,
  address,
  onAddressChange,
}: InterviewLocationFieldsProps) {
  return (
    <>
      {type === 'zoom' && (
        <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
          <CheckIcon className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80">
            A Zoom meeting is created automatically and the link is sent to the
            candidate and interviewers.
          </p>
        </div>
      )}

      {(type === 'zoom' || type === 'google_meet') && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="si-link">
            Meeting Link
            {type === 'google_meet' && (
              <span className="text-destructive ml-0.5">*</span>
            )}
          </Label>
          <Input
            id="si-link"
            placeholder={
              type === 'google_meet'
                ? 'https://meet.google.com/...'
                : 'Leave blank to use the auto-created Zoom link'
            }
            value={meetingLink}
            onChange={e => onMeetingLinkChange(e.target.value)}
            required={type === 'google_meet'}
          />
        </div>
      )}

      {type === 'google_meet' && (
        <div className="flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/10 px-3 py-2.5">
          <AlertTriangleIcon className="size-4 text-warning shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-medium text-warning">
              Google Meet requires a manual link
            </p>
            <p className="text-muted-foreground">
              <strong>Zoom</strong> interviews are auto-created via API — no
              manual link needed. For <strong>Google Meet</strong>, create a
              meeting at{' '}
              <a
                href="https://meet.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                meet.google.com
              </a>{' '}
              and paste the link above.
            </p>
          </div>
        </div>
      )}

      {type === 'phone_call' && (
        <div className="flex flex-col gap-1.5">
          <Label>Phone Number</Label>
          <Input
            placeholder="+1 555-123-4567"
            value={phoneNumber}
            onChange={e => onPhoneNumberChange(e.target.value)}
          />
        </div>
      )}

      {type === 'in_person' && (
        <div className="flex flex-col gap-1.5">
          <Label>Address</Label>
          <Input
            placeholder="123 Main St, New York, NY"
            value={address}
            onChange={e => onAddressChange(e.target.value)}
          />
        </div>
      )}
    </>
  );
}
