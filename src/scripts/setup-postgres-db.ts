import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function setupDatabase() {
  console.log('🚀 Setting up PostgreSQL database...');

  try {
    // Create the connection string
    const connectionString = `postgresql://${process.env.RDS_USER}:${process.env.RDS_PASSWORD}@${process.env.RDS_HOST}:${process.env.RDS_PORT || 5432}/${process.env.RDS_DATABASE}`;

    // Create the postgres client
    const client = postgres(connectionString, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      max: 1, // Single connection for migration
    });

    // Create the drizzle instance
    const db = drizzle(client);

    console.log('📊 Running database migrations...');
    
    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle/postgres' });
    
    console.log('✅ Database setup complete!');
    
    // Close the connection
    await client.end();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };