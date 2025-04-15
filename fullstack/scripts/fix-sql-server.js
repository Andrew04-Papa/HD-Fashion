const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")

// Execute command and return result as promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`)
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

async function fixSqlServer() {
  console.log("SQL Server Connection Fixer")
  console.log("==========================\n")

  try {
    // 1. Check SQL Server services
    console.log("1. Checking SQL Server services...")
    const servicesCmd =
      "powershell \"Get-Service | Where-Object {$_.DisplayName -like '*SQL Server*'} | Format-Table Name, DisplayName, Status -AutoSize\""
    const services = await executeCommand(servicesCmd)
    console.log(services || "No SQL Server services found")

    // 2. Enable TCP/IP protocol if needed
    console.log("\n2. Enabling TCP/IP protocol...")
    console.log("Note: This requires administrative privileges")

    // Create PowerShell script to enable TCP/IP
    const tcpIpScript = `
# Load SQL Server SMO assembly
[System.Reflection.Assembly]::LoadWithPartialName('Microsoft.SqlServer.SqlWmiManagement') | Out-Null

# Get the default SQL Server instance
$wmi = New-Object 'Microsoft.SqlServer.Management.Smo.Wmi.ManagedComputer'

# Enable TCP/IP protocol
$tcpIpProtocol = $wmi.ServerInstances | ForEach-Object { $_.ServerProtocols } | Where-Object { $_.Name -eq 'Tcp' }
if ($tcpIpProtocol) {
    if ($tcpIpProtocol.IsEnabled -eq $false) {
        $tcpIpProtocol.IsEnabled = $true
        $tcpIpProtocol.Alter()
        Write-Output "TCP/IP protocol enabled"
    } else {
        Write-Output "TCP/IP protocol is already enabled"
    }
    
    # Configure TCP port 1433
    $ipAll = $tcpIpProtocol.IPAddresses | Where-Object { $_.Name -eq 'IPAll' }
    if ($ipAll) {
        $port = $ipAll.IPAddressProperties | Where-Object { $_.Name -eq 'TcpPort' }
        if ($port) {
            $port.Value = "1433"
            $tcpIpProtocol.Alter()
            Write-Output "TCP port set to 1433"
        }
    }
} else {
    Write-Output "TCP/IP protocol not found"
}

# Restart SQL Server service
$sqlService = Get-Service -Name 'MSSQLSERVER' -ErrorAction SilentlyContinue
if ($sqlService) {
    Restart-Service -Name 'MSSQLSERVER' -Force
    Write-Output "SQL Server service restarted"
} else {
    $sqlExpressService = Get-Service -Name 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue
    if ($sqlExpressService) {
        Restart-Service -Name 'MSSQL$SQLEXPRESS' -Force
        Write-Output "SQL Server Express service restarted"
    } else {
        Write-Output "SQL Server service not found"
    }
}
`

    fs.writeFileSync("enable-tcp-ip.ps1", tcpIpScript)
    console.log("Created PowerShell script: enable-tcp-ip.ps1")
    console.log("Please run this script as administrator:")
    console.log("powershell -ExecutionPolicy Bypass -File enable-tcp-ip.ps1")

    // 3. Create a test connection script
    console.log("\n3. Creating test connection script...")

    const testScript = `
const sql = require('mssql');

// Test different connection configurations
async function testConnections() {
  const configs = [
    {
      name: "Default instance",
      config: {
        user: 'sa',
        password: 'sa',
        server: 'localhost',
        database: 'hd_fashion',
        options: {
          encrypt: true,
          trustServerCertificate: true,
          connectTimeout: 15000
        }
      }
    },
    {
      name: "Named instance (SQLEXPRESS)",
      config: {
        user: 'sa',
        password: 'sa',
        server: 'localhost\\\\SQLEXPRESS',
        database: 'hd_fashion',
        options: {
          encrypt: true,
          trustServerCertificate: true,
          connectTimeout: 15000
        }
      }
    },
    {
      name: "IP address with port",
      config: {
        user: 'sa',
        password: 'sa',
        server: '127.0.0.1',
        port: 1433,
        database: 'hd_fashion',
        options: {
          encrypt: true,
          trustServerCertificate: true,
          connectTimeout: 15000
        }
      }
    },
    {
      name: "Named pipes",
      config: {
        user: 'sa',
        password: 'sa',
        server: '\\\\\\\\.\\\\pipe\\\\MSSQL$SQLEXPRESS\\\\sql\\\\query',
        database: 'hd_fashion',
        options: {
          encrypt: false,
          trustServerCertificate: true,
          connectTimeout: 15000
        }
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(\`Testing \${name}...\`);
      const pool = await sql.connect(config);
      console.log(\`✅ \${name} connection successful!\`);
      
      // Test query
      const result = await pool.request().query('SELECT @@VERSION AS Version');
      console.log(\`SQL Server version: \${result.recordset[0].Version.split('\\n')[0]}\`);
      
      await pool.close();
      
      // Save working configuration
      console.log(\`Saving working configuration to working-config.json\`);
      require('fs').writeFileSync(
        'working-config.json', 
        JSON.stringify(config, null, 2)
      );
      
      return true;
    } catch (error) {
      console.log(\`❌ \${name} connection failed: \${error.message}\`);
    }
  }
  
  console.log('All connection attempts failed');
  return false;
}

testConnections();
`

    fs.writeFileSync("test-sql-connection.js", testScript)
    console.log("Created test script: test-sql-connection.js")
    console.log("Run this script to test connections:")
    console.log("node test-sql-connection.js")

    // 4. Create .env.local file with updated configuration
    console.log("\n4. Creating updated .env.local file...")

    const envContent = `# Database Configuration
DB_USER=sa
DB_PASSWORD=sa
DB_SERVER=localhost
DB_NAME=hd_fashion
JWT_SECRET=your_super_secret_key_change_this_in_production

# Uncomment and modify the line below if you're using a named instance
# DB_SERVER=localhost\\SQLEXPRESS
`

    fs.writeFileSync(".env.local", envContent)
    console.log("Created .env.local file with updated configuration")

    // 5. Provide instructions for creating the database
    console.log("\n5. Database creation instructions:")
    console.log("If the database doesn't exist, create it using SQL Server Management Studio:")
    console.log("- Open SQL Server Management Studio")
    console.log("- Connect to your SQL Server instance")
    console.log("- Right-click on Databases > New Database")
    console.log('- Enter "hd_fashion" as the database name and click OK')

    console.log("\nAlternatively, you can create the database using this SQL script:")

    const createDbScript = `
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'hd_fashion')
BEGIN
    CREATE DATABASE hd_fashion;
    PRINT 'Database hd_fashion created successfully.';
END
ELSE
BEGIN
    PRINT 'Database hd_fashion already exists.';
END
GO

USE hd_fashion;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Users](
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Email] NVARCHAR(100) NOT NULL UNIQUE,
        [Password] NVARCHAR(255) NOT NULL,
        [IsAdmin] BIT DEFAULT 0,
        [CreatedAt] DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table Users created successfully.';
END
GO

-- Create Categories table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Categories](
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Slug] NVARCHAR(100) NOT NULL UNIQUE,
        [Description] NVARCHAR(MAX)
    );
    PRINT 'Table Categories created successfully.';
END
GO

-- Create Products table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Products](
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(255) NOT NULL,
        [Slug] NVARCHAR(255) NOT NULL UNIQUE,
        [Description] NVARCHAR(MAX),
        [Price] DECIMAL(10, 2) NOT NULL,
        [OriginalPrice] DECIMAL(10, 2),
        [CategoryId] INT,
        [Featured] BIT DEFAULT 0,
        [Bestseller] BIT DEFAULT 0,
        [New] BIT DEFAULT 0,
        [Sale] BIT DEFAULT 0,
        [CreatedAt] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
    );
    PRINT 'Table Products created successfully.';
END
GO
`

    fs.writeFileSync("create-database.sql", createDbScript)
    console.log("Created SQL script: create-database.sql")
    console.log("Run this script in SQL Server Management Studio to create the database")

    console.log("\nSetup complete! Follow the instructions above to fix your SQL Server connection issues.")
  } catch (error) {
    console.error("Error:", error)
  }
}

fixSqlServer()

