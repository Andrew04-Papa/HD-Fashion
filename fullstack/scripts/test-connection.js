const sql = require("mssql")
require("dotenv").config({ path: ".env.local" })

// Configuration for your specific SQL Server instance
const config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "sa",
  server: process.env.DB_SERVER || "DESKTOP-I8F0ORT\\ANDREW", // Your specific server name
  database: "master", // Connect to master first to check if hd_fashion exists
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
  },
}

async function testConnection() {
  try {
    console.log("Testing connection to SQL Server...")
    console.log("Connection config:", {
      user: config.user,
      server: config.server,
      database: config.database,
    })

    // Connect to SQL Server
    const pool = await sql.connect(config)
    console.log("✅ Connected to SQL Server successfully!")

    // Test query to verify connection
    const result = await pool.request().query("SELECT @@VERSION AS Version")
    console.log("SQL Server version:", result.recordset[0].Version.split("\n")[0])

    // Check if hd_fashion database exists
    const dbResult = await pool.request().query(`
      SELECT name FROM master.dbo.sysdatabases WHERE name = 'hd_fashion'
    `)

    if (dbResult.recordset.length === 0) {
      console.log('Database "hd_fashion" does not exist. Creating it...')
      await pool.request().query("CREATE DATABASE hd_fashion")
      console.log("✅ Database created successfully!")
    } else {
      console.log('✅ Database "hd_fashion" already exists.')
    }

    // Close the connection
    await pool.close()
    console.log("Connection closed")

    // Create/update .env.local file
    const fs = require("fs")
    const envContent = `# Database Configuration
DB_USER=sa
DB_PASSWORD=sa
DB_SERVER=DESKTOP-I8F0ORT\\\\ANDREW
DB_NAME=hd_fashion
JWT_SECRET=your_super_secret_key_change_this_in_production
`

    fs.writeFileSync(".env.local", envContent)
    console.log("✅ .env.local file updated with correct connection details.")

    console.log("\nConnection test completed successfully!")
  } catch (error) {
    console.error("❌ SQL Server connection error:", error)
    console.log("\nTroubleshooting tips:")
    console.log("1. Make sure SQL Server is running on DESKTOP-I8F0ORT\\ANDREW")
    console.log('2. Verify that the "sa" user has the correct password and permissions')
    console.log("3. Check that TCP/IP protocol is enabled in SQL Server Configuration Manager")
    console.log("4. Ensure that the SQL Server Browser service is running")
    console.log("5. Check Windows Firewall settings to allow SQL Server connections")
  }
}

testConnection()

