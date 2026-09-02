export default {
    testEnvironment: "node",
    transform: {}, // Disable transforms for ESM
    verbose: true,
    testMatch: ["**/tests/**/*.test.js"],
    collectCoverage: false,
    collectCoverageFrom: ["./**/*.js", "!**/node_modules/**", "!**/config/**", "!**/coverage/**"],
};
