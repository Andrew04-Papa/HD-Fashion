import { exec } from 'child_process';
import { promises as fs } from 'fs';

// PowerShell command execution function
function executePowerShell(command) {
  return new Promise((resolve, reject) => {
    const fullCommand = `powershell -Command "${command}"`;
    console.log(`Executing: ${fullCommand}`);
    
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}

async function configureSqlServer() {
  console.log('SQL Server Configuration Helper');
  console.log('==============================\n');
  
  try {
    // 1. Check if SQL Server is installed
    console.log('1. Checking SQL Server installation...');
    const sqlServices = await executePowerShell('Get-Service | Where-Object {$_.DisplayName -like "*SQL Server*"} | Format-Table Name, DisplayName, Status -AutoSize');
    console.log(sqlServices || 'No SQL Server services found');
    
    if (!sqlServices.includes('Running')) {
      console.log('\n⚠️ WARNING: No running SQL Server services found!');
      console.log('Please make sure SQL Server is installed and running.');
    }
    
    // 2. Check and enable SQL Server Browser
    console.log('\n2. Checking SQL Server Browser service...');
    const browserService = await executePowerShell('Get-Service SQLBrowser | Format-Table Name, DisplayName, Status -AutoSize');
    console.log(browserService);
    
    if (browserService.includes('Stopped')) {
      console.log('SQL Server Browser is stopped. Attempting to start it...');
      try {
        await executePowerShell('Start-Service SQLBrowser; Set-Service SQLBrowser -StartupType Automatic');
        console.log('✅ SQL Server Browser service started and set to automatic startup');
      } catch (error) {
        console.log('❌ Failed to start SQL Server Browser. Try starting it manually from Services.');
      }
    }
    
    // 3. Check TCP/IP configuration
    console.log('\n3. Checking TCP/IP configuration...');
    console.log('Note: This requires SQL Server Configuration Manager which might not be accessible via script.');
    console.log('Please follow these manual steps:');
    console.log('  a. Open SQL Server Configuration Manager');
    console.log('  b. Go to SQL Server Network Configuration > Protocols for [YOUR_INSTANCE]');
    console.log('  c. Ensure TCP/IP is enabled');
    console.log('  d. Right-click on TCP/IP > Properties > IP Addresses tab');
    console.log('  e. For IPAll, clear TCP Dynamic Ports and set TCP Port to 1433');
    
    // 4. Check Windows Firewall
    console.log('\n4. Checking Windows Firewall...');
    const firewallRules = await executePowerShell('Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*SQL*"} | Format-Table DisplayName, Enabled, Direction, Action -AutoSize');
    console.log(firewallRules || 'No SQL Server firewall rules found');
    
    console.log('\nCreating SQL Server firewall rules...');
    try {
      // Create rule for TCP port 1433
      await executePowerShell('New-NetFirewallRule -DisplayName "SQL Server (TCP-1433)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 1433 -ErrorAction SilentlyContinue');
      // Create rule for UDP port 1434 (SQL Browser)
      await executePowerShell('New-NetFirewallRule -DisplayName "SQL Server Browser (UDP-1434)" -Direction Inbound -Action Allow -Protocol UDP -LocalPort 1434 -ErrorAction SilentlyContinue');
      console.log('✅ Firewall rules created or already exist');
    } catch (error) {
      console.log('❌ Failed to create firewall rules. Try creating them manually.');
    }
    
    // 5. Create connection configuration file
    console.log('\n5. Creating connection configuration files...');
    
    // Create .env.local file
    const envContent = `# Database Configuration
DB_USER=sa
DB_PASSWORD=sa
DB_SERVER=localhost
DB_NAME=hd_fashion
JWT_SECRET=your_super_secret_key_change_this_in_production
PORT=5000
`;
    await fs.writeFile('.env.local', envContent);
    
    // Create new lib/db.ts file
    const dbTsContent = `import sql from 'mssql';

// Cấu hình kết nối SQL Server
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'sa',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'hd_fashion',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

// Tạo và quản lý pool connection
let pool: sql.ConnectionPool | null = null;

export const db = {
  connect: async () => {
    try {
      if (!pool) {
        console.log('Connecting to SQL Server...');
        pool = await new sql.ConnectionPool(config).connect();
        console.log('Connected to SQL Server successfully');
      }
      return pool;
    } catch (error) {
      console.error('SQL Server connection error:', error);
      throw error;
    }
  },

  query: async (query: TemplateStringsArray, ...values: any[]) => {
    try {
      // Đảm bảo pool đã được khởi tạo
      if (!pool) {
        await db.connect();
      }

      const request = pool!.request();

      // Xử lý các tham số trong câu truy vấn
      let queryString = query[0];
      for (let i = 0; i < values.length; i++) {
        const paramName = \`p\${i}\`;
        request.input(paramName, values[i]);
        queryString += \`@\${paramName}\${query[i + 1] || ''}\`;
      }

      return await request.query(queryString);
    } catch (error) {
      console.error('SQL query error:', error);
      throw error;
    }
  },

  close: async () => {
    try {
      if (pool) {
        await pool.close();
        pool = null;
        console.log('SQL Server connection closed');
      }
    } catch (error) {
      console.error('Error closing SQL Server connection:', error);
      throw error;
    }
  }
};
`;
    await fs.writeFile('lib/db.ts', dbTsContent);
    
    // Create new test-connection.mjs file
    const testConnectionContent = `import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Cấu hình kết nối SQL Server
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'sa',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'hd_fashion',
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
    const result = await pool.request().query(\`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    \`);
    
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
`;
    await fs.writeFile('test-connection.mjs', testConnectionContent);
    
    console.log('✅ Configuration files created');
    
    // 6. Next instructions
    console.log('\n6. Next steps:');
    console.log('  a. Make sure SQL Server is running');
    console.log('  b. Make sure SQL Server Browser service is running');
    console.log('  c. Run the test connection script: node test-connection.mjs');
    console.log('  d. If still having issues, try creating the database manually:');
    console.log('     - Open SQL Server Management Studio');
    console.log('     - Connect to your SQL Server instance');
    console.log('     - Right-click on Databases > New Database');
    console.log('     - Enter "hd_fashion" as the database name and click OK');
    
  } catch (error) {
    console.error('Error during configuration:', error);
  }
}

configureSqlServer();

