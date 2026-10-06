import fs from 'node:fs';

try {
  await import('./src/app/routes/index.ts');
  fs.writeFileSync('_probe_result.txt', 'ROUTES_OK');
} catch (e: any) {
  fs.writeFileSync('_probe_result.txt', 'ROUTES_FAILED: ' + (e && e.message) + '\n' + (e?.stack ?? ''));
}
process.exit(0);
