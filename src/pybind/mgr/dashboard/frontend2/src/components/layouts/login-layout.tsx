import type { FC, ReactNode } from 'react';

interface LoginLayoutProps {
  children: ReactNode;
}

export const LoginLayout: FC<LoginLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      {children}
    </div>
  );
};
