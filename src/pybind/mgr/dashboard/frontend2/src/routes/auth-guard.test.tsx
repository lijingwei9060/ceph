import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AuthGuard } from '@/routes/auth-guard';
import { LoginPage } from '@/features/auth/pages/login';
import { useAuthStore } from '@/stores/auth-store';

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <div>Protected Dashboard</div>
            </AuthGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('redirects to login when not authenticated', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByText('Ceph Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard')).not.toBeInTheDocument();
  });

  it('shows protected content when authenticated', () => {
    useAuthStore.getState().setAuth({
      username: 'admin',
      permissions: { osd: ['read'] },
      sso: false,
    });
    renderWithRouter('/dashboard');
    expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();
  });
});

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders login form', () => {
    renderWithRouter('/login');
    expect(screen.getByText('Ceph Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows error when submitting empty fields', async () => {
    const user = userEvent.setup();
    renderWithRouter('/login');
    await act(async () => {
      await user.click(screen.getByText('Sign In'));
    });
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });
});
