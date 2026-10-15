import { CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { AuthCard } from './auth-card';

interface AuthInvalidCardProps {
  message: string;
  linkTo: string;
  linkLabel: string;
}

export function AuthInvalidCard({
  message,
  linkTo,
  linkLabel,
}: AuthInvalidCardProps) {
  return (
    <AuthCard>
      <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
        <p className="text-sm text-destructive">{message}</p>
        <Link to={linkTo} className="text-sm text-primary hover:underline">
          {linkLabel}
        </Link>
      </CardContent>
    </AuthCard>
  );
}
