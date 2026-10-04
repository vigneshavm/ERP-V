/**
 * Two test projects (docs/backend-architecture.md §11):
 *  - "api (dist)": the existing *.test.js suites under tests/, which import the compiled app from
 *    dist/ -- run `npm run build` first. No transform (native ESM).
 *  - "unit (ts)": *.test.ts under tests/ and src/, compiled on the fly by ts-jest (ESM). Service and
 *    repository tests for migrated modules live here and import from src/ directly.
 */
const common = {
  testEnvironment: "node",
};

export default {
  verbose: true,
  collectCoverage: false,
  collectCoverageFrom: ["src/**/*.ts", "!src/scripts/**", "!src/**/tests/**"],
  projects: [
    {
      ...common,
      displayName: "api (dist)",
      transform: {},
      testMatch: ["<rootDir>/tests/**/*.test.js"],
      setupFiles: ["<rootDir>/tests/jestAuthEnv.js"],
    },
    {
      ...common,
      displayName: "unit (ts)",
      testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/src/**/*.test.ts"],
      extensionsToTreatAsEsm: [".ts"],
      // Source imports use the ".js" suffix NodeNext requires; point them at the .ts files.
      moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
      transform: {
        "^.+\\.ts$": [
          "ts-jest",
          { useESM: true, tsconfig: "<rootDir>/tsconfig.jest.json" },
        ],
      },
      setupFiles: ["reflect-metadata"],
    },
  ],
};
