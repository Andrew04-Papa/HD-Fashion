import sql from "mssql"
import { dbFallback } from "./db-fallback"

// Create connection variable
let db: sql.ConnectionPool | null = null
let connectionAttempted = false

// Interface for query result
interface QueryResult {
  recordset: any[]
  rowsAffected: number[]
}

export const dbAdapter = {
  query: async (query: string, params: any[] = []): Promise<QueryResult> => {
    try {
      if (!db && !connectionAttempted) {
        connectionAttempted = true
        console.log("Connecting to SQL Server database...")

        try {
          // Configure SQL Server connection from environment variables
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

          db = await sql.connect(config)
          console.log("Connected to SQL Server successfully!")
        } catch (error) {
          console.error("Failed to connect to SQL Server:", error)
          // We'll continue with db as null, and handle the error in the calling code
        }
      }

      if (!db) {
        // Use fallback when unable to connect to SQL Server
        console.log("Using fallback database solution")
        return dbFallback.query(query, params)
      }

      // Execute query with parameterized query
      const request = db.request()

      // Add parameters
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          request.input(`p${index}`, param)
        })
      }

      // Replace ? with @p0, @p1, etc. if the query uses ? for parameters
      const parameterizedQuery = query.replace(/\?/g, (_, i) => `@p${i}`)

      const result = await request.query(parameterizedQuery)
      return result
    } catch (error) {
      console.error("Database query error:", error)

      // Use fallback when there's a query error
      console.log("Falling back to in-memory database after query error")
      return dbFallback.query(query, params)
    }
  },

  // Add method to ensure tables exist
  ensureTables: async (): Promise<boolean> => {
    try {
      if (!db && !connectionAttempted) {
        await dbAdapter.query("SELECT 1", []) // This will attempt to connect
      }

      // If we still don't have a connection, use fallback
      if (!db) {
        return dbFallback.ensureTables()
      }

      // Check if Users table exists and create it if it doesn't
      await db.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
        CREATE TABLE Users (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL,
          Email NVARCHAR(100) NOT NULL UNIQUE,
          Password NVARCHAR(255) NOT NULL,
          IsAdmin BIT DEFAULT 0,
          CreatedAt DATETIME DEFAULT GETDATE()
        )
      `)

      console.log("Tables ensured successfully")
      return true
    } catch (error) {
      console.error("Error ensuring tables:", error)
      return dbFallback.ensureTables()
    }
  },

  // Add method to check if a user exists
  userExists: async (email: string): Promise<boolean> => {
    try {
      if (!db) {
        return dbFallback.userExists(email)
      }

      const result = await dbAdapter.query("SELECT * FROM Users WHERE Email = ?", [email])
      return result.recordset && result.recordset.length > 0
    } catch (error) {
      console.error("Error checking if user exists:", error)
      return dbFallback.userExists(email)
    }
  },
}

