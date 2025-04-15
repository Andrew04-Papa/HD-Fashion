import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Configure SQL Server connection
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function testConnection() {
  try {
    console.log('Attempting to connect to SQL Server...');
    console.log('Connection config:', {
      user: config.user,
      server: config.server,
      database: config.database
    });
    
    const pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to SQL Server successfully!');
    
    // Test query - get all tables
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    console.log('Database tables:');
    console.table(result.recordset);
    
    // Close the connection
    await pool.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('SQL Server connection error:', error);
  }
}

testConnection();

