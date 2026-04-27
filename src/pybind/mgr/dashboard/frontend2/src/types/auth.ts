export interface LoginResponse {
  token: string;
  username: string;
  permissions: Record<string, string[]>;
  pwdExpirationDate: number | null;
  sso: boolean;
  pwdUpdateRequired: boolean;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface AuthCheckResponse {
  login_url?: string;
  username?: string;
  permissions?: Record<string, string[]>;
  sso?: boolean;
  pwdExpirationDate?: number | null;
  pwdUpdateRequired?: boolean;
}

export interface AuthLogoutResponse {
  redirect_url: string;
}
