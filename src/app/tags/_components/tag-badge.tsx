type Props = {
  name: string;
  color: string;
  fallback?: string;
};

export function TagBadge({ name, color, fallback = 'Preview' }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border whitespace-nowrap"
      style={{
        background: `${color}18`,
        borderColor: `${color}55`,
        color,
      }}
    >
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {name || fallback}
    </span>
  );
}
