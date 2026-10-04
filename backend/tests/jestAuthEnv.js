// The API suites create MongoDB users and sign tokens for them, so they run with the old MongoDB login.
// (Production default is AUTH_SOURCE=sql -- Textilesoft users; that path is covered by
// src/integrations/textilesoft/tests/sqlAuth.test.ts.)
process.env.AUTH_SOURCE = process.env.AUTH_SOURCE || "mongo";
