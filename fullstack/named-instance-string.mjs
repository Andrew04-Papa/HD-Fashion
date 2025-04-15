import sql from 'mssql';

async function testConnection() {
  try {
    // Special connection string for named instance
    const connectionString = "Server=DESKTOP-I8F0ORT\\SQLEXPRESS;Database=hd_fashion;User Id=sa;Password=sa;Encrypt=true;TrustServerCertificate=true;";
    console.log('Attempting to connect with connection string:', connectionString);
    
    const pool = await sql.connect(connectionString);
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

