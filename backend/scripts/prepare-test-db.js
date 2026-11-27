const { spawnSync } = require('node:child_process');
const path = require('node:path');

const bin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
);

const command = process.platform === 'win32' ? `"${bin}"` : bin;

const result = spawnSync(command, ['db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: 'file:./test.db' }
});

process.exit(result.status ?? 1);
