import "dotenv/config";

process.env.DATABASE_URL ??= "file:./test.db";
process.env.AUTH_SECRET ??= "test-secret";
