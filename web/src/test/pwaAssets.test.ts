import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(testDirectory, '../..');
const publicRoot = path.join(webRoot, 'public');

function readWebFile(relativePath: string): string {
  return readFileSync(path.join(webRoot, relativePath), 'utf8');
}

function publicFileExists(publicPath: string): boolean {
  return existsSync(path.join(publicRoot, publicPath.replace(/^\//, '')));
}

test('index exposes installable PWA metadata for iOS and Android', () => {
  const index = readWebFile('index.html');

  expect(index).toContain('<link rel="manifest" href="/manifest.webmanifest"');
  expect(index).toContain('<meta name="theme-color" content="#f6efe1"');
  expect(index).toContain('<meta name="apple-mobile-web-app-capable" content="yes"');
  expect(index).toContain('<meta name="apple-mobile-web-app-title" content="Proyecto RM"');
  expect(index).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"');
});

test('manifest describes Proyecto RM as a standalone mobile app with required icons', () => {
  const manifestPath = path.join(publicRoot, 'manifest.webmanifest');

  expect(existsSync(manifestPath)).toBe(true);

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    name: string;
    short_name: string;
    start_url: string;
    scope: string;
    display: string;
    orientation: string;
    theme_color: string;
    background_color: string;
    icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
  };

  expect(manifest.name).toBe('Proyecto RM');
  expect(manifest.short_name).toBe('Proyecto RM');
  expect(manifest.start_url).toBe('/');
  expect(manifest.scope).toBe('/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.orientation).toBe('portrait');
  expect(manifest.theme_color).toBe('#f6efe1');
  expect(manifest.background_color).toBe('#f6efe1');

  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' }),
      expect.objectContaining({ src: '/icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' })
    ])
  );

  for (const icon of manifest.icons) {
    expect(publicFileExists(icon.src)).toBe(true);
  }
});

test('service worker caches the app shell without intercepting api requests', () => {
  const serviceWorkerPath = path.join(publicRoot, 'sw.js');

  expect(existsSync(serviceWorkerPath)).toBe(true);

  const serviceWorker = readFileSync(serviceWorkerPath, 'utf8');

  expect(serviceWorker).toContain('gymchall-pwa-shell');
  expect(serviceWorker).toContain("self.addEventListener('install'");
  expect(serviceWorker).toContain("self.addEventListener('activate'");
  expect(serviceWorker).toContain("self.addEventListener('fetch'");
  expect(serviceWorker).toContain("url.pathname.startsWith('/api/')");
  expect(serviceWorker).toContain('/manifest.webmanifest');
});

test('React entrypoint registers the service worker', () => {
  const main = readWebFile('src/main.tsx');

  expect(main).toContain("import { registerServiceWorker } from './pwa/registerServiceWorker';");
  expect(main).toContain('registerServiceWorker();');
});
