import { RpcError, type UnaryCall } from '@protobuf-ts/runtime-rpc';
import { authClient } from '@/shared/apiClient';
import { useAuthStore } from '@/shared/auth/store';
import { reportRpcFailure } from '@/shared/errorReporter';
import { isTenantSubdomain, getUniversalLoginUrl } from '@/shared/subdomain';

const REPORTABLE_RPC_CODES = ['INTERNAL', 'UNKNOWN', 'UNAVAILABLE', 'DEADLINE_EXCEEDED'];

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    return false;
  }
  if (!refreshInFlight) {
    refreshInFlight = authClient
      .refreshToken({ refreshToken })
      .response.then((auth) => {
        useAuthStore.getState().setSession(auth);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function redirect(path: string): void {
  if (typeof window !== 'undefined' && window.location.pathname !== path) {
    window.location.assign(path);
  }
}

export async function callRpc<I extends object, O extends object>(
  invoke: () => UnaryCall<I, O>,
  skipAutoRefresh = false,
): Promise<O> {
  try {
    return await invoke().response;
  } catch (error) {
    if (error instanceof RpcError) {
      if (error.code === 'UNAUTHENTICATED' && !skipAutoRefresh) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          return await invoke().response;
        }
        useAuthStore.getState().clear();
        if (isTenantSubdomain()) {
          window.location.href = getUniversalLoginUrl(window.location.href);
          return await new Promise(() => {});
        }
        redirect('/login');
      }
      if (error.code === 'PERMISSION_DENIED') {
        redirect('/not-authorized');
      }
      if (REPORTABLE_RPC_CODES.includes(error.code)) {
        reportRpcFailure(error.methodName ?? 'rpc', error);
      }
    }
    throw error;
  }
}

export function rpcErrorMessage(error: unknown): string {
  if (error instanceof RpcError) {
    return error.message || error.code;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Request failed';
}
