import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function ChangePasswordGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sso = useAuthStore((s) => s.sso);
  const pwdUpdateRequired = useAuthStore((s) => s.pwdUpdateRequired);

  if (isAuthenticated && !sso && pwdUpdateRequired) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}

export function NoSsoGuard({ children }: AuthGuardProps) {
  const sso = useAuthStore((s) => s.sso);

  if (sso) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">This page is not available for SSO users.</p>
      </div>
    );
  }

  return <>{children}</>;
}
