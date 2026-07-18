import { readFile, readdir } from 'node:fs/promises';
import { extname, relative } from 'node:path';

const root = new URL('../', import.meta.url);
const ignoredDirectories = new Set(['coverage', 'dist', 'node_modules']);
const allowedExtensions = new Set(['.example', '.js', '.json', '.md', '.mjs', '.ts', '.yaml', '.yml']);
const suspiciousPatterns = [
  /-----BEGIN (?:EC |OPENSSH |PGP |RSA )?PRIVATE KEY-----/u,
  /postgres(?:ql)?:\/\/[^\s/:]+:[^\s/@]+@/iu,
  /(?:access[_-]?token|api[_-]?key|client[_-]?secret|private[_-]?key|refresh[_-]?token)\s*[:=]\s*["'][^"']+["']/iu,
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectFiles(new URL(`${entry.name}/`, directory))));
      }
      continue;
    }

    const extension = entry.name === '.env.example' ? '.example' : extname(entry.name);
    if (allowedExtensions.has(extension) && entry.name !== 'pnpm-lock.yaml') {
      files.push(new URL(entry.name, directory));
    }
  }

  return files;
}

const findings = [];
for (const file of await collectFiles(root)) {
  const source = await readFile(file, 'utf8');
  if (suspiciousPatterns.some((pattern) => pattern.test(source))) {
    findings.push(relative(root.pathname, file.pathname));
  }
}

if (findings.length > 0) {
  throw new Error(`Possível secret encontrado em: ${findings.join(', ')}`);
}

process.stdout.write('Secret audit passed: nenhum valor sensível detectado.\n');
