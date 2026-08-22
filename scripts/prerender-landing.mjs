import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const distDir = path.resolve(root, 'dist');

async function prerender() {
  const htmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`dist/index.html not found at: ${htmlPath}`);
    process.exit(1);
  }

  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    console.log('Rendering Landing Page for SSR...');
    const { renderLanding } = await vite.ssrLoadModule('/src/prerender.tsx');
    const renderedHtml = renderLanding();

    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    htmlContent = htmlContent.replace(
      '<div id="root"></div>',
      `<div id="root">${renderedHtml}</div>`,
    );

    htmlContent = htmlContent.replace(
      /<noscript>TicketSpan Events requires JavaScript to browse and book events.<\/noscript>/g,
      '',
    );

    htmlContent = htmlContent.replace(
      /<div id="hero-flash"[\s\S]*?<\/div>\s*<\/div>/,
      '',
    );

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log('Successfully pre-rendered Landing Page into dist/index.html');
  } finally {
    await vite.close();
  }
}

prerender().catch((err) => {
  console.error('Failed to prerender landing page:', err);
  process.exit(1);
});
