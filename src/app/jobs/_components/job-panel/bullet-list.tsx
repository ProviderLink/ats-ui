import { normalizeBullets } from '../../_utils/job-details';

export function BulletList({ items }: { items: string[] }) {
  const normalized = normalizeBullets(items);
  if (normalized.length === 0) return null;

  return (
    <ul className="space-y-2">
      {normalized.map((item, i) => (
        <li
          key={i}
          className="text-sm flex items-start gap-2.5 text-muted-foreground"
        >
          <span className="mt-2 size-1 rounded-full bg-muted-foreground/50 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
