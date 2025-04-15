import sql from 'mssql';

// Try with SQLEXPRESS (popular instance name)
const config = {
  user: 'sa',
  password: 'sa',
  server: 'DESKTOP-I8F0ORT\\SQLEXPRESS',
  database: 'hd_fashion',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function testConnection() {
  try {
    console.log('Attempting to connect to SQL Server SQLEXPRESS instance...');
    console.log('Connection config:', {
      user: config.user,
      server: config.server,
      database: config.database
    });
    
    const pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to SQL Server successfully!');
    
    // Test query
    const result = await pool.request().query(`SELECT @@SERVERNAME AS ServerName`);
    console.log('Server name:', result.recordset[0].ServerName);
    
    await pool.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('SQL Server connection error:', error);
  }
}

testConnection();

