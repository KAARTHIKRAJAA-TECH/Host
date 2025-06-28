import pg from 'pg';
const { Pool } = pg;

async function testConnection() {
  console.log("Testing database connection...");
  
  // Log environment variables (don't log sensitive values in production)
  console.log("DATABASE_URL format:", process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'not set');
  console.log("PGHOST:", process.env.PGHOST);
  console.log("PGPORT:", process.env.PGPORT);
  console.log("PGUSER:", process.env.PGUSER);
  console.log("PGDATABASE:", process.env.PGDATABASE);
  
  try {
    // Create a connection pool with SSL enabled
    const pool = new Pool({
      ssl: {
        rejectUnauthorized: false // Only use this for development
      }
    });
    
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log("Connection successful!");
    console.log("Current timestamp:", result.rows[0].now);
    
    // Test creating a table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id SERIAL PRIMARY KEY,
          message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("Test table created successfully");
      
      // Insert a row
      await pool.query(`
        INSERT INTO test_connection (message) VALUES ($1)
      `, ['Connection test at ' + new Date().toISOString()]);
      console.log("Test row inserted successfully");
      
      // Query the table
      const testRows = await pool.query('SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 5');
      console.log("Recent test entries:");
      console.log(testRows.rows);
    } catch (err) {
      console.error("Error with test table operations:", err);
    }
    
    // Close the pool
    await pool.end();
  } catch (err) {
    console.error("Connection error:", err);
  }
}

testConnection().catch(console.error);