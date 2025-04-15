const sql = require("mssql")
require("dotenv").config()

// Configure SQL Server connection
const config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "sa",
  server: process.env.DB_SERVER || "DESKTOP-I8F0ORT\\ANDREW",
  database: process.env.DB_NAME || "HD_Fashion",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
}

// Create connection pool
const pool = new sql.ConnectionPool(config)

// Connection and error handling
const connectDB = async () => {
  try {
    await pool.connect()
    console.log("SQL Server connected successfully")
    return pool
  } catch (error) {
    console.error("SQL Server connection error:", error)
    process.exit(1)
  }
}

module.exports = { connectDB, pool }