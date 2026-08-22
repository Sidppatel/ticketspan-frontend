import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { initErrorReporter } from '@/shared/errorReporter';
import { resolvePortalContext } from '@/shared/subdomain';
import { fetchPublicBranding, prefetchDefaultPublicEventList, prefetchPublicEventBySlug } from '@/shared/theme/brandingPrefetch';
import '@/index.css';

initErrorReporter();

const backendUrl = import.meta.env.VITE_BACKEND_URL;
if (backendUrl) {
  try {
    const origin = new URL(backendUrl).origin;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  } catch (e) {
    void e;
  }
}

const bootContext = resolvePortalContext();
if (bootContext.portal === 'public' && bootContext.tenantSlug) {
  void fetchPublicBranding(bootContext.tenantSlug).catch(() => undefined);
  const bootPath = window.location.pathname;
  const eventSlugMatch = /^\/events\/([^/]+)$/.exec(bootPath);
  if (eventSlugMatch) {
    prefetchPublicEventBySlug(decodeURIComponent(eventSlugMatch[1]));
  } else if (bootPath === '/') {
    prefetchDefaultPublicEventList();
  }
}
document.documentElement.style.colorScheme = 'light';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing');
}

const rootApp = (
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

const isPrerenderedLanding =
  container.hasChildNodes() &&
  window.location.pathname === '/' &&
  resolvePortalContext().portal === 'public' &&
  !resolvePortalContext().tenantSlug;

if (isPrerenderedLanding) {
  hydrateRoot(container, rootApp);
} else {
  createRoot(container).render(rootApp);
}
