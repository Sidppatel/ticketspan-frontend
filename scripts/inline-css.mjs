import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

function inlineCss() {
  const htmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`dist/index.html not found at: ${htmlPath}`);
    process.exit(1);
  }

  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const cssLinkMatch = htmlContent.match(/<link rel="stylesheet"[^>]*href="\/assets\/index-([^"]+)\.css"[^>]*>/);

  if (!cssLinkMatch) {
    console.log('No hashed index-*.css link found to inline.');
    return;
  }

  const cssFileName = `index-${cssLinkMatch[1]}.css`;
  const cssFilePath = path.join(distDir, 'assets', cssFileName);

  if (!fs.existsSync(cssFilePath)) {
    console.error(`CSS file not found at: ${cssFilePath}`);
    process.exit(1);
  }

  console.log(`Inlining CSS: ${cssFileName}`);
  const cssContent = fs.readFileSync(cssFilePath, 'utf8');

  const styleBlock = `<style>${cssContent}</style>`;
  htmlContent = htmlContent.replace(cssLinkMatch[0], styleBlock);

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Successfully inlined CSS into index.html');

  try {
    fs.unlinkSync(cssFilePath);
    console.log(`Removed original file: ${cssFilePath}`);
  } catch (err) {
    console.warn(`Could not remove ${cssFilePath}:`, err.message);
  }
}

inlineCss();
