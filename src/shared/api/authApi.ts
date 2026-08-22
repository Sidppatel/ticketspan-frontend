import { httpGet, httpPost } from './httpClient';
import type {
  AckEnvelope,
  AuthApiResponse,
  GoogleAuthApiRequest,
  LoginApiRequest,
  MagicLinkRequestApiRequest,
  PasswordResetConfirmApiRequest,
  PasswordResetRequestApiRequest,
  SignUpApiRequest,
  UserProfileApiResponse,
  VerifyMagicLinkApiRequest,
} from './types';

export const authApi = {
  login(payload: LoginApiRequest): Promise<AuthApiResponse> {
    return httpPost<AuthApiResponse, LoginApiRequest>('/api/v1/auth/login', payload);
  },

  signUp(payload: SignUpApiRequest): Promise<AuthApiResponse> {
    return httpPost<AuthApiResponse, SignUpApiRequest>('/api/v1/auth/signup', payload);
  },

  loginWithGoogle(payload: GoogleAuthApiRequest): Promise<AuthApiResponse> {
    return httpPost<AuthApiResponse, GoogleAuthApiRequest>('/api/v1/auth/google', payload);
  },

  requestMagicLink(payload: MagicLinkRequestApiRequest): Promise<AckEnvelope> {
    return httpPost<AckEnvelope, MagicLinkRequestApiRequest>('/api/v1/auth/magic-link/request', payload);
  },

  verifyMagicLink(payload: VerifyMagicLinkApiRequest): Promise<AuthApiResponse> {
    return httpPost<AuthApiResponse, VerifyMagicLinkApiRequest>('/api/v1/auth/magic-link/verify', payload);
  },

  requestPasswordReset(payload: PasswordResetRequestApiRequest): Promise<AckEnvelope> {
    return httpPost<AckEnvelope, PasswordResetRequestApiRequest>('/api/v1/auth/password-reset/request', payload);
  },

  confirmPasswordReset(payload: PasswordResetConfirmApiRequest): Promise<AckEnvelope> {
    return httpPost<AckEnvelope, PasswordResetConfirmApiRequest>('/api/v1/auth/password-reset/confirm', payload);
  },

  getMe(): Promise<UserProfileApiResponse> {
    return httpGet<UserProfileApiResponse>('/api/v1/auth/me');
  },
};
