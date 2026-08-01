import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const capacitorConfigPath = join(root, 'capacitor.config.ts');
const capacitorConfig = readFileSync(capacitorConfigPath, 'utf8');

const failures = [];

if (/server\s*:\s*{[\s\S]*?\burl\s*:/m.test(capacitorConfig)) {
  failures.push('Remove `server.url` from capacitor.config.ts before building the native app.');
}
if (/server\s*:\s*{[\s\S]*?\bhostname\s*:/m.test(capacitorConfig)) {
  failures.push('Remove `server.hostname` from capacitor.config.ts before building the native app.');
}
if (/allowNavigation\s*:/.test(capacitorConfig)) {
  failures.push('Remove `server.allowNavigation` from capacitor.config.ts — native app must not navigate to external origins.');
}

const scanTargets = [
  'capacitor.config.ts',
  'index.html',
  'package.json',
  'src',
  'public',
];

const ignoredDirectories = new Set([
  'dist',
  'node_modules',
]);

const ignoredFiles = new Set([
  'guard-mobile-build.mjs',
  'nativeSafety.ts',
  'package-lock.json',
  'bun.lockb',
  'tsconfig.app.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
]);

const textExtensions = new Set([
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.txt',
  '.toml',
  '.xml',
  '.plist',
]);

const forbiddenPatterns = [
  { pattern: /lovable\.dev/i, label: 'lovable.dev' },
  { pattern: /lovableproject\.com/i, label: 'lovableproject.com' },
  { pattern: /lovableproject-dev\.com/i, label: 'lovableproject-dev.com' },
  { pattern: /forceHideBadge/i, label: 'forceHideBadge' },
  { pattern: /app\.lovable\.[a-z0-9.-]+/i, label: 'app.lovable.*' },
  { pattern: /\.lovable\.app/i, label: '*.lovable.app' },
  { pattern: /@lovable\.dev\/cloud-auth-js/i, label: '@lovable.dev/cloud-auth-js' },
  { pattern: /createLovableAuth/i, label: 'createLovableAuth' },
];

const forbiddenPwaPatterns = [
  { pattern: /vite-plugin-pwa/i, label: 'vite-plugin-pwa' },
  { pattern: /VitePWA/i, label: 'VitePWA' },
  { pattern: /virtual:pwa-register/i, label: 'virtual:pwa-register' },
  { pattern: /navigator\.serviceWorker\.register/i, label: 'service worker registration' },
  { pattern: /registerSW\s*\(/i, label: 'registerSW' },
  { pattern: /workbox/i, label: 'Workbox app-shell cache' },
];

function shouldScanForPwaReferences(relativePath) {
  return relativePath === 'vite.config.ts' || relativePath === 'package.json' || relativePath.startsWith('src/');
}

function scanContent(content, relativePath) {
  // `@lovable.dev/mcp-js` is a build-time npm package name (the MCP server SDK),
  // not a runtime URL — it never redirects the native app to lovable.dev.
  const sanitized = content.replace(/@lovable\.dev\/mcp-js(\/[a-z0-9/._-]*)?/gi, '@mcp-sdk');

  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(sanitized)) {
      failures.push(`${relativePath} contains forbidden native-build reference: ${label}`);
    }
  }

  if (shouldScanForPwaReferences(relativePath)) {
    for (const { pattern, label } of forbiddenPwaPatterns) {
      if (pattern.test(sanitized)) {
        failures.push(`${relativePath} contains forbidden native-build PWA/cache reference: ${label}`);
      }
    }
  }
}

function hasTextExtension(filePath) {
  return [...textExtensions].some((extension) => filePath.endsWith(extension));
}

function scanDirectory(directory) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      scanDirectory(fullPath);
      continue;
    }

    if (!stats.isFile() || ignoredFiles.has(entry) || !hasTextExtension(fullPath)) continue;

    const content = readFileSync(fullPath, 'utf8');
    scanContent(content, relative(root, fullPath));
  }
}

for (const target of scanTargets) {
  const fullPath = join(root, target);
  const stats = statSync(fullPath);
  if (stats.isDirectory()) {
    scanDirectory(fullPath);
  } else if (stats.isFile()) {
    const content = readFileSync(fullPath, 'utf8');
    scanContent(content, target);
  }
}

if (failures.length > 0) {
  console.error('Native build guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Native build guard passed.');