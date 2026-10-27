import { defineConfig } from 'vitest/config';

// Coverage gate for the pure logic only (RNF-6). Components are thin templates.
// The include globs must also live in `angular.json` (`coverageInclude`): the
// Angular test builder resolves them there, not in this file.
export default defineConfig({
  base: '/simple-pomodoro/',
  test: {
    coverage: {
      include: [
        'src/app/timer/timer.logic.ts',
        'src/app/timer/timer-storage.ts',
        'src/app/consent/consent.logic.ts',
        'src/app/palette/**',
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
