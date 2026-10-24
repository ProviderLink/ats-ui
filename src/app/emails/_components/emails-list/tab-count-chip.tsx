export function TabCountChip({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-300 px-1 text-[10px] font-medium text-gray-800 dark:bg-muted-foreground/15 dark:text-muted-foreground">
      {n}
    </span>
  );
}
