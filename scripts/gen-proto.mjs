import { mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const isWindows = process.platform === 'win32';
const binExt = isWindows ? '.CMD' : '';
const protocBin = join(root, 'node_modules', '.bin', `protoc${binExt}`);
const pluginBin = join(root, 'node_modules', '.bin', `protoc-gen-ts${binExt}`);
const outDir = join(root, 'src', 'shared', 'proto');
const protoPath = resolve(root, '..', 'svyne-event-backend', 'protos');

const protoFiles = [
  'common.proto',
  'auth.proto',
  'event.proto',
  'tenant.proto',
  'catalog.proto',
  'booking.proto',
  'bookings.proto',
  'admin.proto',
  'enums.proto',
  'fees.proto',
  'pricing.proto',
  'floorplan.proto',
  'reporting.proto',
];

mkdirSync(outDir, { recursive: true });

const quote = (value) => `"${value}"`;
const command = [
  quote(protocBin),
  `--plugin=protoc-gen-ts=${quote(pluginBin)}`,
  `--ts_out=${quote(outDir)}`,
  '--ts_opt=long_type_string,optimize_speed,eslint_disable',
  `--proto_path=${quote(protoPath)}`,
  ...protoFiles,
].join(' ');

execSync(command, { stdio: 'inherit', cwd: root, shell: true });
