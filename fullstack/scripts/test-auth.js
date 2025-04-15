const bcrypt = require("bcryptjs")
const sql = require("mssql")
require("dotenv").config({ path: ".env.local" })

// Configuration for SQL Server
const config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "sa",
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "hd_fashion",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 30000,
  },
}

async function testAuth() {
  console.log("Testing authentication system...")
  console.log("Connection config:", {
    user: config.user,
    server: config.server,
    database: config.database,
  })

  try {
    // Connect to database
    console.log("Connecting to database...")
    const pool = await sql.connect(config)
    console.log("Connected successfully!")

    // Check if Users table exists
    console.log("Checking Users table...")
    const tableResult = await pool.request().query(`
      SELECT OBJECT_ID('Users') as TableExists
    `)

    if (!tableResult.recordset[0].TableExists) {
      console.log("Users table does not exist. Creating it...")
      await pool.request().query(`
        CREATE TABLE Users (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL,
          Email NVARCHAR(100) NOT NULL UNIQUE,
          Password NVARCHAR(255) NOT NULL,
          IsAdmin BIT DEFAULT 0,
          CreatedAt DATETIME DEFAULT GETDATE()
        )
      `)
      console.log("Users table created successfully!")
    } else {
      console.log("Users table exists.")
    }

    // Check for test user
    console.log("Checking for test user...")
    const testEmail = "test@example.com"
    const testPassword = "password123"

    const userResult = await pool.request().input("email", testEmail).query("SELECT * FROM Users WHERE Email = @email")

    let testUser

    if (userResult.recordset.length === 0) {
      console.log("Test user does not exist. Creating test user...")

      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(testPassword, salt)

      // Create test user
      const insertResult = await pool
        .request()
        .input("name", "Test User")
        .input("email", testEmail)
        .input("password", hashedPassword)
        .input("isAdmin", 0)
        .query(`
          INSERT INTO Users (Name, Email, Password, IsAdmin)
          OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.IsAdmin
          VALUES (@name, @email, @password, @isAdmin)
        `)

      testUser = insertResult.recordset[0]
      console.log("Test user created:", testUser)
    } else {
      testUser = userResult.recordset[0]
      console.log("Test user found:", { id: testUser.Id, email: testUser.Email })
    }

    // Test password verification
    console.log("Testing password verification...")
    const isPasswordValid = await bcrypt.compare(testPassword, testUser.Password)
    console.log("Password valid:", isPasswordValid)

    if (!isPasswordValid) {
      console.log("WARNING: Password verification failed. Updating password...")

      // Update password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(testPassword, salt)

      await pool
        .request()
        .input("password", hashedPassword)
        .input("id", testUser.Id)
        .query("UPDATE Users SET Password = @password WHERE Id = @id")

      console.log("Password updated successfully.")
    }

    console.log("\nTest completed successfully!")
    console.log("\nYou can now log in with:")
    console.log(`Email: ${testEmail}`)
    console.log(`Password: ${testPassword}`)

    // Close connection
    await pool.close()
  } catch (error) {
    console.error("Error during authentication test:", error)
  }
}

testAuth()

