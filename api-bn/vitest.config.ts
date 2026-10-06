import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/setup/global-setup.ts'],
    // REDIS_URL kosong -> withCache() di src/app/utils/cache.ts otomatis
    // bypass Redis (fallback ke fetcher langsung), supaya test integrasi
    // tidak flaky akibat data ter-cache lintas test run.
    env: {
      NODE_ENV: 'test',
      REDIS_URL: '',
    },
    // Test yang sama-sama memakai satu Postgres real (master_bn_test) harus
    // jalan berurutan, bukan paralel, supaya reset DB antar test tidak
    // tabrakan satu sama lain.
    fileParallelism: false,
  },
});
