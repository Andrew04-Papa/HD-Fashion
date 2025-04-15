const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const sql = require("mssql")

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

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fixSqlConnection() {
  console.log("SQL Server Connection Fixer")
  console.log("==========================\n")

  try {
    // 1. Check SQL Server services
    console.log("1. Checking SQL Server services...")
    const servicesCmd =
      "powershell \"Get-Service | Where-Object {$_.DisplayName -like '*SQL Server*'} | Format-Table Name, DisplayName, Status -AutoSize\""
    const services = await executeCommand(servicesCmd)
    console.log(services || "No SQL Server services found")

    if (!services.includes("Running")) {
      console.log("\n⚠️ WARNING: No running SQL Server services found!")
      console.log("Please start SQL Server service before continuing.")
      console.log("You can start it by running:")
      console.log("  net start MSSQLSERVER    (for default instance)")
      console.log("  net start MSSQL$SQLEXPRESS  (for SQLEXPRESS instance)")

      const startService = await askQuestion("Do you want to try starting SQL Server service now? (y/n): ")
      if (startService.toLowerCase() === "y") {
        try {
          console.log("Attempting to start SQL Server service...")
          await executeCommand("net start MSSQLSERVER")
          console.log("SQL Server service started successfully.")
        } catch (error) {
          try {
            console.log("Attempting to start SQL Server Express service...")
            await executeCommand("net start MSSQL$SQLEXPRESS")
            console.log("SQL Server Express service started successfully.")
          } catch (error) {
            console.log("Failed to start SQL Server services. Please start them manually.")
          }
        }
      }
    }

    // 2. Check SQL Server instances
    console.log("\n2. Checking SQL Server instances...")
    try {
      const instancesCmd =
        "powershell \"Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL' -ErrorAction SilentlyContinue | Format-Table -AutoSize\""
      const instances = await executeCommand(instancesCmd)
      console.log(instances || "No SQL Server instances found in registry")
    } catch (error) {
      console.log("Could not query registry for SQL instances")
    }

    // 3. Check TCP/IP protocol status and enable it
    console.log("\n3. Enabling TCP/IP protocol...")

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

    const scriptPath = path.join(process.cwd(), "enable-tcp-ip.ps1")
    fs.writeFileSync(scriptPath, tcpIpScript)
    console.log(`Created PowerShell script: ${scriptPath}`)
    console.log("Please run this script as administrator:")
    console.log("powershell -ExecutionPolicy Bypass -File enable-tcp-ip.ps1")

    // 4. Check firewall and create rules
    console.log("\n4. Checking Windows Firewall...")
    const firewallRules = await executeCommand(
      "powershell \"Get-NetFirewallRule | Where-Object {$_.DisplayName -like '*SQL*'} | Format-Table DisplayName, Enabled, Direction, Action -AutoSize\"",
    )
    console.log(firewallRules || "No SQL Server firewall rules found")

    console.log("\nCreating SQL Server firewall rules...")
    try {
      // Create rule for TCP port 1433
      await executeCommand(
        "powershell \"New-NetFirewallRule -DisplayName 'SQL Server (TCP-1433)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 1433 -ErrorAction SilentlyContinue\"",
      )
      // Create rule for UDP port 1434 (SQL Browser)
      await executeCommand(
        "powershell \"New-NetFirewallRule -DisplayName 'SQL Server Browser (UDP-1434)' -Direction Inbound -Action Allow -Protocol UDP -LocalPort 1434 -ErrorAction SilentlyContinue\"",
      )
      console.log("✅ Firewall rules created or already exist")
    } catch (error) {
      console.log("❌ Failed to create firewall rules. Try creating them manually.")
    }

    // 5. Test connections
    console.log("\n5. Testing SQL Server connections...")

    // List of connection configurations to try
    const connectionConfigs = [
      {
        name: "Default instance",
        config: {
          user: "sa",
          password: "sa",
          server: "localhost",
          database: "master",
          options: {
            encrypt: true,
            trustServerCertificate: true,
            connectTimeout: 15000,
          },
        },
      },
      {
        name: "Named instance (SQLEXPRESS)",
        config: {
          user: "sa",
          password: "sa",
          server: "localhost\\SQLEXPRESS",
          database: "master",
          options: {
            encrypt: true,
            trustServerCertificate: true,
            connectTimeout: 15000,
          },
        },
      },
      {
        name: "IP address with port",
        config: {
          user: "sa",
          password: "sa",
          server: "127.0.0.1",
          port: 1433,
          database: "master",
          options: {
            encrypt: true,
            trustServerCertificate: true,
            connectTimeout: 15000,
          },
        },
      },
      {
        name: "Named pipes",
        config: {
          user: "sa",
          password: "sa",
          server: "\\\\.\\pipe\\MSSQL$SQLEXPRESS\\sql\\query",
          database: "master",
          options: {
            encrypt: false,
            trustServerCertificate: true,
            connectTimeout: 15000,
          },
        },
      },
    ]

    let connectionSuccessful = false
    let workingConfig = null

    for (const { name, config } of connectionConfigs) {
      try {
        console.log(`Testing ${name}...`)
        const pool = await sql.connect(config)
        console.log(`✅ ${name} connection successful!`)

        // Test query
        const result = await pool.request().query("SELECT @@VERSION AS Version")
        console.log(`SQL Server version: ${result.recordset[0].Version.split("\n")[0]}`)

        await pool.close()

        // Save working configuration
        workingConfig = config
        connectionSuccessful = true
        break
      } catch (error) {
        console.log(`❌ ${name} connection failed: ${error.message}`)
      }
    }

    if (connectionSuccessful) {
      console.log("\n✅ Found a working connection configuration!")

      // Create database if it doesn't exist
      try {
        console.log("\nAttempting to create database if it doesn't exist...")
        const pool = await sql.connect(workingConfig)

        await pool.request().query(`
          IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = 'hd_fashion')
          BEGIN
            CREATE DATABASE hd_fashion;
            PRINT 'Database hd_fashion created successfully.';
          END
          ELSE
          BEGIN
            PRINT 'Database hd_fashion already exists.';
          END
        `)

        console.log("Database check/creation completed successfully.")
        await pool.close()
      } catch (error) {
        console.log(`Failed to create database: ${error.message}`)
      }

      // Update .env.local file
      try {
        console.log("\nUpdating .env.local file with working configuration...")
        const envContent = `# Database Configuration
DB_USER=${workingConfig.user}
DB_PASSWORD=${workingConfig.password}
DB_SERVER=${workingConfig.server}
DB_NAME=hd_fashion
JWT_SECRET=your_super_secret_key_change_this_in_production
`

        fs.writeFileSync(".env.local", envContent)
        console.log("✅ .env.local file updated successfully.")
      } catch (error) {
        console.log(`Failed to update .env.local file: ${error.message}`)
      }

      // Update db.ts file
      console.log("\nCreating updated db.ts file...")
      const dbTsContent = `import sql from "mssql";

// Create and manage connection pool
let pool: sql.ConnectionPool | null = null;

// Working configuration
const config = {
  user: process.env.DB_USER || "${workingConfig.user}",
  password: process.env.DB_PASSWORD || "${workingConfig.password}",
  server: process.env.DB_SERVER || "${workingConfig.server}",
  ${workingConfig.port ? `port: ${workingConfig.port},` : ""}
  database: process.env.DB_NAME || "hd_fashion",
  options: {
    encrypt: ${workingConfig.options.encrypt},
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const db = {
  connect: async (): Promise<sql.ConnectionPool> => {
    try {
      if (!pool) {
        console.log("Connecting to SQL Server...");
        pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected to SQL Server successfully");
      }
      return pool;
    } catch (error) {
      console.error("SQL Server connection error:", error);
      throw error;
    }
  },

  query: async <T = any>(query: TemplateStringsArray | string, ...values: any[]): Promise<sql.IResult<T>> => {
    try {
      // Make sure the pool is initialized
      if (!pool) {
        await db.connect();
      }

      const request = pool!.request();

      // Handle both string queries and template literals
      if (typeof query === 'string') {
        // For string queries, use parameterized queries
        for (let i = 0; i < values.length; i++) {
          const paramName = \`p\${i}\`;
          request.input(paramName, values[i]);
        }
        
        // Replace ? with @p0, @p1, etc.
        const parameterizedQuery = (query as string).replace(/\\?/g, (_, i) => \`@p\${i}\`);
        return await request.query<T>(parameterizedQuery);
      } else {
        // For template literals (TemplateStringsArray)
        let queryString = query[0];
        for (let i = 0; i < values.length; i++) {
          const paramName = \`p\${i}\`;
          request.input(paramName, values[i]);
          queryString += \`@\${paramName}\${query[i + 1] || ""}\`;
        }
        return await request.query<T>(queryString);
      }
    } catch (error) {
      console.error("SQL query error:", error);
      
      // Try to reconnect if the connection was lost
      if (error instanceof Error && 
          (error.message.includes('Connection lost') || 
           error.message.includes('Connection closed') ||
           error.message.includes('not connected'))) {
        console.log("Connection lost, attempting to reconnect...");
        pool = null;
        await db.connect();
        return db.query(query, ...values);
      }
      
      throw error;
    }
  },

  close: async (): Promise<void> => {
    try {
      if (pool) {
        await pool.close();
        pool = null;
        console.log("SQL Server connection closed");
      }
    } catch (error) {
      console.error("Error closing SQL Server connection:", error);
      throw error;
    }
  },
};
`

      fs.writeFileSync("lib/db.ts", dbTsContent)
      console.log("✅ db.ts file updated successfully.")
    } else {
      console.log("\n❌ All connection attempts failed.")
      console.log("Please check your SQL Server installation and configuration.")

      // Create SQLite fallback
      console.log("\nCreating SQLite fallback...")

      // Update package.json to include SQLite dependencies
      try {
        const packageJsonPath = path.join(process.cwd(), "package.json")
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

        if (!packageJson.dependencies.sqlite) {
          packageJson.dependencies.sqlite = "^5.0.1"
        }

        if (!packageJson.dependencies.sqlite3) {
          packageJson.dependencies.sqlite3 = "^5.1.6"
        }

        if (!packageJson.devDependencies["@types/sqlite3"]) {
          packageJson.devDependencies["@types/sqlite3"] = "^3.1.11"
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
        console.log("✅ package.json updated with SQLite dependencies.")
        console.log('Please run "npm install" to install the new dependencies.')
      } catch (error) {
        console.log(`Failed to update package.json: ${error.message}`)
      }
    }

    console.log("\nSetup complete! Follow the instructions above to fix your SQL Server connection issues.")
  } catch (error) {
    console.error("Error:", error)
  }
}

// Helper function to ask questions
function askQuestion(question) {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close()
      resolve(answer)
    })
  })
}

// Run the function
fixSqlConnection()

