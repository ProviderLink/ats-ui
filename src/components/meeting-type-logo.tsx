import { cn } from '@/lib/utils';
import { MapPinIcon, PhoneIcon, VideoIcon } from 'lucide-react';
import { useId } from 'react';

/** Simplified Zoom mark: blue tile with a white camera. */
function ZoomLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#0B5CFF" />
      <rect x="4.5" y="8" width="9.5" height="8" rx="2" fill="#fff" />
      <path d="M15.5 10.6 19.5 8v8l-4-2.6z" fill="#fff" />
    </svg>
  );
}

/** Simplified Google Meet mark: four-colour camera. */
function GoogleMeetLogo({ className }: { className?: string }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <rect x="2" y="5" width="15" height="14" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="2" y="5" width="8" height="7" fill="#EA4335" />
        <rect x="10" y="5" width="7" height="7" fill="#FFBA00" />
        <rect x="2" y="12" width="8" height="7" fill="#4285F4" />
        <rect x="10" y="12" width="7" height="7" fill="#00AC47" />
        <rect x="6" y="9" width="7" height="6" rx="1.5" fill="#fff" />
      </g>
      <path d="M17.5 10.2 22 7v10l-4.5-3.2z" fill="#00AC47" />
    </svg>
  );
}

const LABELS: Record<string, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  phone_call: 'Phone Call',
  in_person: 'In Person',
  video: 'Video Call',
};

/** The provider's logo for a meeting type; a plain icon where there is no brand. */
export function MeetingTypeIcon({
  type,
  className = 'size-4',
}: {
  type: string;
  className?: string;
}) {
  switch (type) {
    case 'zoom':
      return <ZoomLogo className={cn('shrink-0', className)} />;
    case 'google_meet':
      return <GoogleMeetLogo className={cn('shrink-0', className)} />;
    case 'phone_call':
      return (
        <PhoneIcon
          className={cn(
            'shrink-0 text-amber-600 dark:text-amber-400',
            className,
          )}
        />
      );
    case 'in_person':
      return (
        <MapPinIcon
          className={cn(
            'shrink-0 text-violet-600 dark:text-violet-400',
            className,
          )}
        />
      );
    default:
      return (
        <VideoIcon
          className={cn('shrink-0 text-teal-600 dark:text-teal-400', className)}
        />
      );
  }
}

/** Logo plus provider name, with no surrounding box. */
export function MeetingTypeLabel({
  type,
  className,
  iconClassName,
}: {
  type: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium text-foreground',
        className,
      )}
    >
      <MeetingTypeIcon type={type} className={iconClassName} />
      {LABELS[type] ?? type}
    </span>
  );
}
