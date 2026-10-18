export function ColHeader({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
