import sql from 'mssql';

// List of connection configurations to try
const connectionConfigs = [
  // 1. Connect to localhost (default instance)
  {
    name: "Default instance on localhost",
    config: {
      user: 'sa',
      password: 'sa',
      server: 'localhost',
      database: 'hd_fashion',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000 // Reduce timeout time for faster testing
      }
    }
  },
  
  // 2. Connect to IP address
  {
    name: "Default instance on IP",
    config: {
      user: 'sa',
      password: 'sa',
      server: '127.0.0.1',
      database: 'hd_fashion',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000
      }
    }
  },
  
  // 3. Connect to SQLEXPRESS instance
  {
    name: "SQLEXPRESS instance",
    config: {
      user: 'sa',
      password: 'sa',
      server: 'DESKTOP-I8F0ORT\\SQLEXPRESS',
      database: 'hd_fashion',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000
      }
    }
  },
  
  // 4. Connect to MSSQLSERVER instance (default instance name)
  {
    name: "MSSQLSERVER instance",
    config: {
      user: 'sa',
      password: 'sa',
      server: 'DESKTOP-I8F0ORT',
      database: 'hd_fashion',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000
      }
    }
  },
  
  // 5. Connect to localhost and specific port
  {
    name: "Localhost with specific port",
    config: {
      user: 'sa',
      password: 'sa',
      server: 'localhost',
      port: 1433,
      database: 'hd_fashion',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000
      }
    }
  }
];

// List of connection strings to try
const connectionStrings = [
  {
    name: "Connection string with localhost",
    connectionString: "Server=localhost;Database=hd_fashion;User Id=sa;Password=sa;Encrypt=true;TrustServerCertificate=true;Connection Timeout=5;"
  },
  {
    name: "Connection string with IP",
    connectionString: "Server=127.0.0.1;Database=hd_fashion;User Id=sa;Password=sa;Encrypt=true;TrustServerCertificate=true;Connection Timeout=5;"
  },
  {
    name: "Connection string with SQLEXPRESS",
    connectionString: "Server=DESKTOP-I8F0ORT\\SQLEXPRESS;Database=hd_fashion;User Id=sa;Password=sa;Encrypt=true;TrustServerCertificate=true;Connection Timeout=5;"
  },
  {
    name: "Connection string with port",
    connectionString: "Server=localhost,1433;Database=hd_fashion;User Id=sa;Password=sa;Encrypt=true;TrustServerCertificate=true;Connection Timeout=5;"
  }
];

async function testConnections() {
  console.log('Testing SQL Server connections...\n');
  
  // Try connecting with the configurations
  console.log('TESTING CONNECTION CONFIGS:');
  console.log('==========================');
  for (const connTest of connectionConfigs) {
    try {
      console.log(`\nTesting: ${connTest.name}`);
      console.log(`Config: ${JSON.stringify(connTest.config)}`);
      
      const pool = await sql.connect(connTest.config);
      console.log('✅ CONNECTION SUCCESSFUL!');
      
      // Try basic query
      try {
        const result = await pool.request().query('SELECT @@VERSION AS Version');
        console.log('SQL Server version:', result.recordset[0].Version);
      } catch (queryError) {
        console.log('Query failed:', queryError.message);
      }
      
      await pool.close();
      console.log('Connection closed');
      
      // If the connection is successful, save the configuration
      console.log('\n✅ WORKING CONNECTION FOUND!');
      console.log('Use this configuration in your application:');
      console.log(JSON.stringify(connTest.config, null, 2));
      
      // Create configuration file
      const fs = await import('fs');
      fs.writeFileSync('working-config.json', JSON.stringify(connTest.config, null, 2));
      console.log('Configuration saved to working-config.json');
      
      return; // Exit if active configuration found
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}\n`);
    }
  }
  
  // Try connecting with connection strings
  console.log('\nTESTING CONNECTION STRINGS:');
  console.log('==========================');
  for (const connString of connectionStrings) {
    try {
      console.log(`\nTesting: ${connString.name}`);
      console.log(`Connection string: ${connString.connectionString}`);
      
      const pool = await sql.connect(connString.connectionString);
      console.log('✅ CONNECTION SUCCESSFUL!');
      
      // Try basic query
      try {
        const result = await pool.request().query('SELECT @@VERSION AS Version');
        console.log('SQL Server version:', result.recordset[0].Version);
      } catch (queryError) {
        console.log('Query failed:', queryError.message);
      }
      
      await pool.close();
      console.log('Connection closed');
      
      // If the connection is successful, save the connection string
      console.log('\n✅ WORKING CONNECTION STRING FOUND!');
      console.log('Use this connection string in your application:');
      console.log(connString.connectionString);
      
      // Create configuration file
      const fs = await import('fs');
      fs.writeFileSync('working-connection-string.txt', connString.connectionString);
      console.log('Connection string saved to working-connection-string.txt');
      
      return; // Exit if active connection string found
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}\n`);
    }
  }
  
  console.log('\n❌ All connection attempts failed.');
  console.log('Please check your SQL Server installation and configuration.');
}

testConnections().catch(err => {
  console.error('Error in test script:', err);
});

