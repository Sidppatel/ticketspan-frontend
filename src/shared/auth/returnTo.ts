const KEY = 'auth:returnTo';

function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

export function setReturnTo(path: string): void {
  try {
    if (isSafeInternalPath(path)) sessionStorage.setItem(KEY, path);
  } catch {
    return;
  }
}

export function takeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value && isSafeInternalPath(value) ? value : null;
  } catch {
    return null;
  }
}
