import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url));

let version = 'unknown';

try {
  const raw = readFileSync(packageJsonPath, 'utf8');
  const data = JSON.parse(raw) as { version?: unknown };
  if (typeof data.version === 'string') {
    version = data.version;
  }
} catch {
  version = 'unknown';
}

export const VERSION = version;
