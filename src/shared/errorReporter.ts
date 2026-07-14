import type { ClientErrorReport } from '@/shared/proto/admin';

const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_FLUSH_SIZE = 10;
const MAX_REPORTS_PER_SESSION = 30;
const MAX_BREADCRUMBS = 10;
const OFFLINE_STORAGE_KEY = 'entryvine_pending_error_reports';
const MAX_OFFLINE_REPORTS = 50;

type Breadcrumb = { at: number; action: string };

let queue: ClientErrorReport[] = [];
let breadcrumbs: Breadcrumb[] = [];
const seenErrors = new Set<string>();
let reportedCount = 0;
let previousUrl = '';
let currentUrl = '';
let initialized = false;

function sessionId(): string {
  let id = sessionStorage.getItem('entryvine_error_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('entryvine_error_session_id', id);
  }
  return id;
}

function trackUrlChange(): void {
  if (window.location.href !== currentUrl) {
    previousUrl = currentUrl;
    currentUrl = window.location.href;
  }
}

function describeClickTarget(target: EventTarget | null): string {
  if (!(target instanceof Element)) {
    return 'unknown';
  }
  const text = (target.textContent ?? '').trim().slice(0, 40);
  const id = target.id ? `#${target.id}` : '';
  return `${target.tagName.toLowerCase()}${id} "${text}"`;
}

function addBreadcrumb(action: string): void {
  breadcrumbs.push({ at: Date.now(), action });
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS);
  }
}

export function reportError(
  errorType: string,
  message: string,
  stackTrace: string,
  severity: 'High' | 'Medium' | 'Low' | 'Warning' | 'Info' = 'Medium',
): void {
  const dedupeKey = `${errorType}:${message}`;
  if (seenErrors.has(dedupeKey) || reportedCount >= MAX_REPORTS_PER_SESSION) {
    return;
  }
  seenErrors.add(dedupeKey);
  reportedCount += 1;
  trackUrlChange();
  queue.push({
    errorType: errorType.slice(0, 200),
    message: message.slice(0, 2000),
    stackTrace: stackTrace.slice(0, 8000),
    severity,
    pageUrl: currentUrl.slice(0, 500),
    previousUrl: previousUrl.slice(0, 500),
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    sessionId: sessionId(),
    breadcrumbsJson: JSON.stringify(breadcrumbs),
    occurredAt: String(Math.floor(Date.now() / 1000)),
  });
  if (queue.length >= MAX_QUEUE_FLUSH_SIZE) {
    void flush();
  }
}

export function reportRpcFailure(methodName: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? '') : '';
  reportError('ApiError', `${methodName}: ${message}`, stack, 'High');
}

function loadOfflineReports(): ClientErrorReport[] {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClientErrorReport[]) : [];
  } catch {
    return [];
  }
}

function saveOfflineReports(reports: ClientErrorReport[]): void {
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(reports.slice(-MAX_OFFLINE_REPORTS)));
  } catch {
    return;
  }
}

async function flush(): Promise<void> {
  const pending = [...loadOfflineReports(), ...queue];
  if (pending.length === 0) {
    return;
  }
  queue = [];
  localStorage.removeItem(OFFLINE_STORAGE_KEY);
  try {
    const { logClient } = await import('@/shared/apiClient');
    await logClient.reportClientErrors({ reports: pending.slice(0, 20) }).response;
  } catch {
    saveOfflineReports(pending);
  }
}

export function initErrorReporter(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }
  initialized = true;
  currentUrl = window.location.href;

  window.addEventListener('error', (event) => {
    reportError(
      event.error instanceof Error ? event.error.name : 'WindowError',
      event.message,
      event.error instanceof Error ? (event.error.stack ?? '') : `${event.filename}:${event.lineno}:${event.colno}`,
      'High',
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    reportError(
      reason instanceof Error ? reason.name : 'UnhandledRejection',
      reason instanceof Error ? reason.message : String(reason),
      reason instanceof Error ? (reason.stack ?? '') : '',
      'High',
    );
  });

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);
    const first = args[0];
    reportError(
      'ConsoleError',
      args.map((a) => (a instanceof Error ? a.message : String(a))).join(' ').slice(0, 500),
      first instanceof Error ? (first.stack ?? '') : '',
      'Low',
    );
  };

  const originalConsoleWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    originalConsoleWarn(...args);
    const first = args[0];
    reportError(
      'ConsoleWarning',
      args.map((a) => (a instanceof Error ? a.message : String(a))).join(' ').slice(0, 500),
      first instanceof Error ? (first.stack ?? '') : '',
      'Warning',
    );
  };

  document.addEventListener(
    'click',
    (event) => {
      trackUrlChange();
      addBreadcrumb(`click ${describeClickTarget(event.target)}`);
    },
    { capture: true, passive: true },
  );

  window.setInterval(() => void flush(), FLUSH_INTERVAL_MS);
  window.addEventListener('beforeunload', () => {
    if (queue.length > 0) {
      saveOfflineReports([...loadOfflineReports(), ...queue]);
    }
  });
}
