import { Label } from '@/components/ui/label';

interface CategorySectionProps {
  title: string;
  weight: number;
  weighted: number;
  children: React.ReactNode;
}

export function CategorySection({
  title,
  weight,
  weighted,
  children,
}: CategorySectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            weight {weight}
          </span>
        </Label>
        <span className="text-xs text-muted-foreground">
          weighted:{' '}
          <span className="font-medium text-foreground">
            {weighted.toFixed(1)}
          </span>
          /{weight}
        </span>
      </div>
      {children}
    </section>
  );
}
