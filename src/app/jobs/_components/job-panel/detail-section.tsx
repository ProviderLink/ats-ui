interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest shrink-0">
          {title}
        </span>
        <div className="flex-1 border-t" />
      </div>
      {children}
    </div>
  );
}
