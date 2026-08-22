import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { TenantLandingPage } from '@/features/public/pages/TenantLandingPage';

export function renderLanding(): string {
  return renderToString(
    <MemoryRouter initialEntries={['/']}>
      <TenantLandingPage />
    </MemoryRouter>,
  );
}
