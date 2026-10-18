import { CheckCircleIcon } from 'lucide-react';

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="flex scroll-mt-20 flex-col gap-4 border-b border-border p-6 sm:p-8 lg:scroll-mt-8"
    >
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-base text-foreground"
        >
          <span className="mt-2 size-1.5 rounded-full bg-muted-foreground shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-base text-foreground"
        >
          <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-careers" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
