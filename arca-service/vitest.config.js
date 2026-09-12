import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./test/globalSetup.js'],
    setupFiles: ['./test/setupEnv.js'],
    // The suite shares one Postgres database across files; keep them sequential
    // so tests that touch overlapping rows (e.g. archiving) don't race.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
