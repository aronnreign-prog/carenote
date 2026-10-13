import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    fsModuleCache: true,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/proxy.ts',
        'src/lib/validators.ts',
        'src/lib/ai/schemas.ts',
        'src/lib/ai/extract.ts',
        'src/lib/zep/ingest.ts',
        'src/app/actions/demo.ts',
        'src/app/dashboard/actions.ts',
        'src/app/dashboard/patients/[id]/pipeline-actions.ts',
        'src/app/admin/actions.ts',
        'src/app/api/records/[id]/view/route.ts',
        'src/app/api/patients/[id]/records/route.ts',
        'src/app/api/patients/[id]/syntheses/route.ts',
        'src/app/api/patients/[id]/syntheses/stream/route.ts',
      ],
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['tests/dom/**/*.test.tsx'],
        },
      },
      {
        define: {
          'process.env': JSON.stringify({ NODE_ENV: 'test' }),
        },
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'e2e',
          environment: 'node',
          include: ['tests/e2e/**/*.test.ts'],
          testTimeout: 120000,
          hookTimeout: 120000,
          fileParallelism: false,
          execArgv: ['--env-file=.env.local'],
        },
      },
    ],
  },
})

