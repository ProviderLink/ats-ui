import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReviewSectionProps {
  title: string;
  titleClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export function ReviewSection({
  title,
  titleClassName = 'text-lg',
  contentClassName,
  children,
}: ReviewSectionProps) {
  return (
    <Card className="careers-card rounded-2xl">
      <CardHeader>
        <CardTitle className={`font-heading ${titleClassName}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
