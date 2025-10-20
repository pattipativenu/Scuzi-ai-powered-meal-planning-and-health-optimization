import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './postgres-schema';

// Create the connection string
const connectionString = `postgresql://${process.env.RDS_USER}:${process.env.RDS_PASSWORD}@${process.env.RDS_HOST}:${process.env.RDS_PORT || 5432}/${process.env.RDS_DATABASE}`;

// Create the postgres client
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout in seconds
});

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export the client for manual queries if needed
export { client };