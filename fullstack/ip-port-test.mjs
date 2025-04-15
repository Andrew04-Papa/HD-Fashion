import sql from 'mssql';

// Configure direct connection with IP and port
const config = {
  user: 'sa',
  password: 'sa',
  server: 'localhost', 
  port: 1433, 
  database: 'hd_fashion',
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
      port: config.port,
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

