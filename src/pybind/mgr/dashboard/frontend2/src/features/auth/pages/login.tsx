import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { uiApiClient } from '@/lib/api-client';
import * as authService from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Check auth status on load to determine SSO flow
    const checkAuth = async () => {
      try {
        // Extract token from URL hash if present (SSO callback)
        let token: string | undefined;
        if (window.location.hash.indexOf('access_token=') !== -1) {
          token = window.location.hash.split('access_token=')[1];
          // Clean the URL
          const uri = window.location.toString();
          window.history.replaceState({}, document.title, uri.split('?')[0]);
        }

        const response = await authService.check(token);

        if (response.login_url) {
          if (response.login_url === '#/login') {
            // SSO not configured, show login form
            setShowLoginForm(true);
          } else {
            // SSO configured, redirect to SSO login URL
            window.location.replace(response.login_url);
            return;
          }
        } else if (response.username && response.permissions) {
          // Already authenticated
          setAuth({
            username: response.username,
            permissions: response.permissions,
            sso: response.sso ?? false,
            pwdExpirationDate: response.pwdExpirationDate,
            pwdUpdateRequired: response.pwdUpdateRequired,
          });
          navigate('/dashboard', { replace: true });
          return;
        } else {
          // No login_url and no auth data, show login form
          setShowLoginForm(true);
        }
      } catch {
        // Error checking auth, show login form
        setShowLoginForm(true);
      } finally {
        setChecking(false);
      }
    };

    // Only check auth if not already authenticated
    if (!useAuthStore.getState().isAuthenticated) {
      checkAuth();
    } else {
      navigate('/dashboard', { replace: true });
    }

    // Load custom banner
    uiApiClient.get('login/custom_banner').text().then((text) => {
      // Filter out "null" string (API returns null when not configured)
      if (text && text !== 'null') {
        setBanner(text);
      }
    }).catch(() => {});
  }, [navigate, setAuth]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
    } catch {
      setError('password', { message: t('auth.loginFailed') });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (!showLoginForm) {
    return null;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          {t('auth.loginTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {banner && (
          <div className="mb-4 rounded border bg-muted/50 p-3 text-sm">
            {banner}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('auth.username')}</Label>
            <Input
              id="username"
              autoComplete="username"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.loginButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
