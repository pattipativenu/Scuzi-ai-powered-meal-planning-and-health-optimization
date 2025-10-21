import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// Create client only if environment variables are available
let client: any = null;
let db: any = null;

if (process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN) {
  client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db = drizzle(client, { schema });
} else {
  // Create a mock database for build time
  console.warn('Turso database not configured - using mock database');
  db = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) }),
  };
}

export { db };
export type Database = typeof db;