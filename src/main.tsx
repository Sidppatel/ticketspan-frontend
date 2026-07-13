import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { initErrorReporter } from '@/shared/errorReporter';
import { resolvePortalContext } from '@/shared/subdomain';
import { fetchPublicBranding, prefetchDefaultPublicEventList, prefetchPublicEventBySlug } from '@/shared/theme/brandingPrefetch';
import '@/index.css';

initErrorReporter();
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

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
