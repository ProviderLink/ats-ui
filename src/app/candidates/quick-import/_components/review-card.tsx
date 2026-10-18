import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReviewCardProps {
  title: string;
  children: React.ReactNode;
}

export function ReviewCard({ title, children }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
