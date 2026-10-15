import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackToSignInLink() {
  return (
    <Link
      to="/ats/login"
      className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="size-3.5" />
      Back to sign in
    </Link>
  );
}
