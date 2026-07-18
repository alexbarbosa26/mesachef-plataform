import { spawnSync } from 'node:child_process';

const expectedNodeMajor = 24;
const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '', 10);

function inspectCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) {
    return { available: false, version: null };
  }

  return {
    available: true,
    version: result.stdout.trim(),
  };
}

const pnpmVersionMatch = /^pnpm\/([^\s]+)/u.exec(
  process.env['npm_config_user_agent'] ?? '',
);
const pnpm = {
  available: pnpmVersionMatch !== null,
  version: pnpmVersionMatch?.[1] ?? null,
};
const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';
const docker = inspectCommand(dockerCommand, ['--version']);
const compose = inspectCommand(dockerCommand, [
  'compose',
  'version',
  '--short',
]);
const nodeIsSupported = nodeMajor === expectedNodeMajor;

const report = {
  docker,
  dockerCompose: compose,
  node: {
    supported: nodeIsSupported,
    version: process.versions.node,
  },
  pnpm,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (!nodeIsSupported || !pnpm.available) {
  process.exitCode = 1;
}
