import sql from 'mssql';

async function testConnection() {
  try {
    console.log('Attempting to connect to SQL Server using connection string...');
    
    // Try with direct connection string
    const connectionString = "Server=localhost;Database=hd_fashion;User Id=sa;Password=sa;Encrypt=true;TrustServerCertificate=true;";
    console.log('Connection string:', connectionString);
    
    const pool = await sql.connect(connectionString);
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

