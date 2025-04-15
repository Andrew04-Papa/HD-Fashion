import type sql from "mssql"
import { dbAdapter } from "./db-adapter"

// Create and manage connection pools
const pool: sql.ConnectionPool | null = null

// List of connection configurations to try
const connectionConfigs = [
  // 1. Default instance with longer timeout and connection retry logic
  {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "sa",
    server: "localhost",
    database: process.env.DB_NAME || "hd_fashion",
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 30000, // Longer timeout (30 seconds)
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      requestTimeout: 30000,
    },
  },

  // 2. Named instance SQLEXPRESS with explicit port
  {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "sa",
    server: "DESKTOP-I8F0ORT\\SQLEXPRESS",
    port: 1433, // Explicitly set port
    database: process.env.DB_NAME || "hd_fashion",
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 30000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },

  // 3. Try with named pipes connection
  {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "sa",
    server: "\\\\DESKTOP-I8F0ORT\\pipe\\MSSQL$SQLEXPRESS\\sql\\query",
    database: process.env.DB_NAME || "hd_fashion",
    options: {
      encrypt: false, // Named pipes don't use encryption
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 30000,
    },
  },

  // 4. Try with SQL Server Browser and dynamic port
  {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "sa",
    server: "DESKTOP-I8F0ORT",
    database: process.env.DB_NAME || "hd_fashion",
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 30000,
      instanceName: "SQLEXPRESS", // Use SQL Server Browser to find the instance
    },
  },

  // 5. IP address with port
  {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "sa",
    server: "127.0.0.1",
    port: 1433,
    database: process.env.DB_NAME || "hd_fashion",
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 30000,
    },
  },
]

// List of connection strings to try
const connectionStrings = [
  // 1. Default instance with TCP forcing
  `Server=localhost,1433;Database=${process.env.DB_NAME || "hd_fashion"};User Id=${process.env.DB_USER || "sa"};Password=${process.env.DB_PASSWORD || "sa"};Encrypt=true;TrustServerCertificate=true;Connection Timeout=30;Application Name=FashionEcommerce;`,

  // 2. Named instance with TCP forcing
  `Server=DESKTOP-I8F0ORT\\SQLEXPRESS,1433;Database=${process.env.DB_NAME || "hd_fashion"};User Id=${process.env.DB_USER || "sa"};Password=${process.env.DB_PASSWORD || "sa"};Encrypt=true;TrustServerCertificate=true;Connection Timeout=30;Application Name=FashionEcommerce;`,

  // 3. Named pipes connection string
  `Server=np:\\\\DESKTOP-I8F0ORT\\pipe\\MSSQL$SQLEXPRESS\\sql\\query;Database=${process.env.DB_NAME || "hd_fashion"};User Id=${process.env.DB_USER || "sa"};Password=${process.env.DB_PASSWORD || "sa"};Encrypt=false;TrustServerCertificate=true;Connection Timeout=30;Application Name=FashionEcommerce;`,

  // 4. IP with port
  `Server=127.0.0.1,1433;Database=${process.env.DB_NAME || "hd_fashion"};User Id=${process.env.DB_USER || "sa"};Password=${process.env.DB_PASSWORD || "sa"};Encrypt=true;TrustServerCertificate=true;Connection Timeout=30;Application Name=FashionEcommerce;`,
]

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Re-export dbAdapter as db for backward compatibility
export const db = dbAdapter

