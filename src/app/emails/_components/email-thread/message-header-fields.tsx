import type { Email } from '@/store/types';

function Row({
  label,
  children,
  valueClass = 'text-foreground',
}: {
  label: string;
  children: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-10 shrink-0 text-muted-foreground">{label}</span>
      <span className={`break-all ${valueClass}`}>{children}</span>
    </div>
  );
}

export function MessageHeaderFields({ email }: { email: Email }) {
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <Row label="From">{email.from}</Row>
      <Row label="To">{email.to.join(', ')}</Row>
      {!!email.cc?.length && <Row label="Cc">{email.cc.join(', ')}</Row>}
      {!!email.bcc?.length && <Row label="Bcc">{email.bcc.join(', ')}</Row>}
      {email.failureReason && email.status === 'failed' && (
        <Row label="Error" valueClass="text-destructive">
          {email.failureReason}
        </Row>
      )}
    </div>
  );
}
