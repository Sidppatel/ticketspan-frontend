// Where to send the user after a successful sign in / sign up. Stored in
// sessionStorage (not router state) so it survives navigating between the
// /login and /register pages and a full page reload during the auth flow.
const KEY = 'auth:returnTo';

function isSafeInternalPath(path: string): boolean {
  // Same-origin app path only; reject protocol-relative `//host` and absolute URLs.
  return path.startsWith('/') && !path.startsWith('//');
}

export function setReturnTo(path: string): void {
  try {
    if (isSafeInternalPath(path)) sessionStorage.setItem(KEY, path);
  } catch {
    // sessionStorage unavailable (private mode / SSR) — non-fatal.
  }
}

// Reads and clears the pending return target. Returns null if none/invalid.
export function takeReturnTo(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value && isSafeInternalPath(value) ? value : null;
  } catch {
    return null;
  }
}
