import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const guard = resolve('scripts/guard-mobile-build.mjs');

function runGuard(manifest: object, source = '') {
  const root = mkdtempSync(join(tmpdir(), 'native-guard-'));
  try {
    mkdirSync(join(root, 'src'));
    mkdirSync(join(root, 'public'));
    writeFileSync(join(root, 'capacitor.config.ts'), 'export default {};');
    writeFileSync(join(root, 'index.html'), '<html></html>');
    writeFileSync(join(root, 'package.json'), JSON.stringify(manifest));
    writeFileSync(join(root, 'src', 'app.ts'), source);
    return spawnSync(process.execPath, [guard], { cwd: root, encoding: 'utf8' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const previewDependencies = {
  '@lovable.dev/vite-plugin-dev-server-bridge': '^1.0.2',
  '@lovable.dev/vite-plugin-hmr-gate': '^1.8.3',
};

describe('native build guard', () => {
  it('allows the exact preview development packages and MCP SDK', () => {
    expect(runGuard({ devDependencies: previewDependencies, dependencies: { '@lovable.dev/mcp-js': '^0.26.1' } }).status).toBe(0);
  });

  it('still rejects forbidden URLs in allowed dependency values', () => {
    const result = runGuard({ devDependencies: { ...previewDependencies, '@lovable.dev/vite-plugin-hmr-gate': 'https://lovable.dev/package.tgz' } });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('package.json contains forbidden native-build reference: lovable.dev');
  });

  it('still rejects the removed cloud auth package', () => {
    expect(runGuard({ dependencies: { '@lovable.dev/cloud-auth-js': '^1.0.0' } }).status).toBe(1);
  });

  it('does not exempt preview package names in runtime code', () => {
    expect(runGuard({}, 'import "@lovable.dev/vite-plugin-hmr-gate";').status).toBe(1);
  });

  it('still rejects runtime redirect URLs', () => {
    expect(runGuard({ devDependencies: previewDependencies }, 'location.href = "https://lovable.dev/login";').status).toBe(1);
  });
});