import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AuthGuard } from '@/routes/auth-guard';
import { LoginPage } from '@/routes/login-page';
import { useAppStore } from '@/stores/app-store';

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
    useAppStore.getState().logout();
  });

  it('redirects to login when not authenticated', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByText('Ceph Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard')).not.toBeInTheDocument();
  });

  it('shows protected content when authenticated', () => {
    useAppStore.getState().login('admin');
    renderWithRouter('/dashboard');
    expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();
  });
});

describe('LoginPage', () => {
  beforeEach(() => {
    useAppStore.getState().logout();
  });

  it('renders login form', () => {
    renderWithRouter('/login');
    expect(screen.getByText('Ceph Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows error when submitting empty fields', async () => {
    const user = userEvent.setup();
    renderWithRouter('/login');
    await user.click(screen.getByText('Sign In'));
    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
  });

  it('logs in with valid credentials', async () => {
    const user = userEvent.setup();
    renderWithRouter('/login');
    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'pass');
    await user.click(screen.getByText('Sign In'));
    expect(useAppStore.getState().isAuthenticated).toBe(true);
    expect(useAppStore.getState().username).toBe('admin');
  });
});
