import sql from 'mssql';


const config = {
  user: 'sa',
  password: 'sa',
  server: '(LocalDB)\\MSSQLLocalDB', 
  database: 'hd_fashion',
  options: {
    encrypt: false, 
    trustServerCertificate: true,
  },
};

async function testLocalDbConnection() {
  try {
    console.log('Attempting to connect to SQL Server LocalDB...');
    console.log('Connection config:', {
      user: config.user,
      server: config.server,
      database: config.database
    });
    
    const pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to LocalDB successfully!');
    
    try {
      const result = await pool.request().query(`
        SELECT name FROM master.dbo.sysdatabases WHERE name = 'hd_fashion'
      `);
      
      if (result.recordset.length === 0) {
        console.log('Database "hd_fashion" does not exist. Creating it...');
        await pool.request().query('CREATE DATABASE hd_fashion');
        console.log('Database created successfully!');
      } else {
        console.log('Database "hd_fashion" already exists.');
      }
    } catch (dbError) {
      console.error('Error checking/creating database:', dbError);
    }
    
    // Close the connection
    await pool.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('LocalDB connection error:', error);
  }
}

testLocalDbConnection();

