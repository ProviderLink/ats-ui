import { AuthBackground } from './_components/auth-background';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center bg-background p-4">
      <AuthBackground />
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/arista-ats.png"
            alt=""
            className="size-8 rounded-md object-contain"
          />
          <span className="text-base font-semibold text-foreground">Arista ATS</span>
        </div>
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
