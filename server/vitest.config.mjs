import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    include: ['src/tests/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/supplysetu_test?schema=public',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/supplysetu_test?schema=public',
      JWT_SECRET: 'test_jwt_secret_key_minimum_32_characters_for_vitest',
      NODE_ENV: 'test',
    },
  },
});
