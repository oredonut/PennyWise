// Jest config scoped to the pure-TS OCR module. Uses ts-jest with a strict,
// Node-targeted tsconfig so these tests run with zero React Native / Expo
// toolchain and zero device — plain `npx jest` from mobile/.
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/lib/ocr'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.ocr.json' }],
  },
}
