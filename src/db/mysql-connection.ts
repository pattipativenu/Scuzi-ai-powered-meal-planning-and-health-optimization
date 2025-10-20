import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './mysql-schema';

// Create the connection
const connection = mysql.createPool({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '3306'),
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Create the drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Export the connection for manual queries if needed
export { connection };