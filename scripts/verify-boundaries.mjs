import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const sourceExtensions = new Set(['.ts', '.tsx']);

const boundaryRules = [
  {
    directory: 'packages/domain/src',
    forbidden: [
      '@mesachef/',
      '@supabase/',
      'fastify',
      'node:',
      'pg',
      'react',
    ],
  },
  {
    directory: 'packages/shared/src',
    forbidden: ['@mesachef/', '@supabase/', 'fastify', 'node:', 'pg', 'react'],
  },
  {
    directory: 'packages/database/src',
    forbidden: ['@supabase/', 'fastify', 'react'],
  },
  {
    directory: 'packages/ui/src',
    forbidden: ['@mesachef/database', '@supabase/', 'fastify', 'node:', 'pg'],
  },
  {
    directory: 'apps/web/src',
    forbidden: [
      '@mesachef/database',
      '@supabase/',
      'better-sqlite3',
      'node:sqlite',
      'pg',
      'postgres',
    ],
  },
  {
    directory: 'apps/api/src',
    forbidden: ['@supabase/', 'react', 'react-dom'],
  },
];

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return listSourceFiles(path);
      }
      return sourceExtensions.has(extname(entry.name)) ? [path] : [];
    }),
  );
  return nestedFiles.flat();
}

function importedSpecifiers(source) {
  const specifiers = [];
  const importPattern = /(?:from\s+|import\s*\()(['"])([^'"]+)\1/gu;
  let match = importPattern.exec(source);

  while (match !== null) {
    if (match[2] !== undefined) {
      specifiers.push(match[2]);
    }
    match = importPattern.exec(source);
  }

  return specifiers;
}

async function findBoundaryViolations() {
  const violations = [];

  for (const rule of boundaryRules) {
    const absoluteDirectory = join(workspaceRoot, rule.directory);
    const files = await listSourceFiles(absoluteDirectory);

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      for (const specifier of importedSpecifiers(source)) {
        const forbiddenDependency = rule.forbidden.find((candidate) =>
          specifier.startsWith(candidate),
        );
        if (forbiddenDependency !== undefined) {
          violations.push(
            `${relative(workspaceRoot, file)} imports forbidden dependency ${specifier}`,
          );
        }
      }
    }
  }

  return violations;
}

async function readWorkspaceGraph() {
  const workspaceDirectories = [
    'apps/api',
    'apps/web',
    'packages/database',
    'packages/domain',
    'packages/shared',
    'packages/ui',
  ];
  const manifests = await Promise.all(
    workspaceDirectories.map(async (directory) => {
      const manifest = JSON.parse(
        await readFile(join(workspaceRoot, directory, 'package.json'), 'utf8'),
      );
      return [manifest.name, manifest];
    }),
  );
  const workspaceNames = new Set(manifests.map(([name]) => name));

  return new Map(
    manifests.map(([name, manifest]) => {
      const dependencies = {
        ...manifest.dependencies,
        ...manifest.peerDependencies,
      };
      return [
        name,
        Object.keys(dependencies).filter((dependency) =>
          workspaceNames.has(dependency),
        ),
      ];
    }),
  );
}

function findCycles(graph) {
  const cycles = [];
  const visited = new Set();
  const active = new Set();

  function visit(node, path) {
    if (active.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push([...path.slice(cycleStart), node].join(' -> '));
      return;
    }
    if (visited.has(node)) {
      return;
    }

    active.add(node);
    for (const dependency of graph.get(node) ?? []) {
      visit(dependency, [...path, node]);
    }
    active.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) {
    visit(node, []);
  }

  return cycles;
}

const boundaryViolations = await findBoundaryViolations();
const cycles = findCycles(await readWorkspaceGraph());
const failures = [
  ...boundaryViolations,
  ...cycles.map((cycle) => `Workspace dependency cycle: ${cycle}`),
];

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Architecture boundaries verified.\n');
}
