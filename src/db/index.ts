// Conditional imports to prevent libsql loading during build
let db: any = null;

// Only import and initialize if we're in runtime with proper environment
if (typeof window === 'undefined' && process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN) {
  try {
    const { drizzle } = require('drizzle-orm/libsql');
    const { createClient } = require('@libsql/client');
    const schema = require('@/db/schema');
    
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    db = drizzle(client, { schema });
  } catch (error) {
    console.warn('Failed to initialize Turso database:', error);
    db = createMockDb();
  }
} else {
  // Create a mock database for build time or when env vars are missing
  console.warn('Turso database not configured - using mock database');
  db = createMockDb();
}

function createMockDb() {
  return {
    select: () => ({ 
      from: () => ({ 
        where: () => ({ 
          limit: () => Promise.resolve([]),
          orderBy: () => ({ limit: () => Promise.resolve([]) })
        }) 
      }) 
    }),
    insert: () => ({ 
      values: () => ({ 
        returning: () => Promise.resolve([]),
        onConflictDoUpdate: () => ({ returning: () => Promise.resolve([]) })
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({ 
          returning: () => Promise.resolve([]) 
        }) 
      }) 
    }),
    delete: () => ({ 
      where: () => ({ 
        returning: () => Promise.resolve([]) 
      }) 
    }),
  };
}

export { db };
export type Database = typeof db;