import { beforeAll, afterAll, afterEach } from 'vitest';
import {
  resetDatabase,
  runMigrations,
  disconnectDatabase,
  getTestPrisma,
} from './helpers/db';

getTestPrisma();

beforeAll(async () => {
  await runMigrations();
});

afterEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
