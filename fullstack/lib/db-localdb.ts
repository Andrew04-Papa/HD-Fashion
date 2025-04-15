import sql from "mssql"

// Configure LocalDB connection
const config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "sa",
  server: "(LocalDB)\\MSSQLLocalDB", // Default instance name of LocalDB
  database: process.env.DB_NAME || "hd_fashion",
  options: {
    encrypt: false, // LocalDB does not require encryption
    trustServerCertificate: true,
    enableArithAbort: true,
  },
}

// Create and manage connection pool
let pool: sql.ConnectionPool | null = null

export const db = {
  connect: async () => {
    try {
      if (!pool) {
        console.log("Connecting to SQL Server LocalDB...")
        pool = await new sql.ConnectionPool(config).connect()
        console.log("Connected to LocalDB successfully")
      }
      return pool
    } catch (error) {
      console.error("LocalDB connection error:", error)
      throw error
    }
  },

  query: async (query: TemplateStringsArray, ...values: any[]) => {
    try {
      // Make sure the pool is initialized
      if (!pool) {
        await db.connect()
      }

      const request = pool!.request()

      // Process parameters in the query
      let queryString = query[0]
      for (let i = 0; i < values.length; i++) {
        const paramName = `p${i}`
        request.input(paramName, values[i])
        queryString += `@${paramName}${query[i + 1] || ""}`
      }

      return await request.query(queryString)
    } catch (error) {
      console.error("SQL query error:", error)
      throw error
    }
  },

  close: async () => {
    try {
      if (pool) {
        await pool.close()
        pool = null
        console.log("LocalDB connection closed")
      }
    } catch (error) {
      console.error("Error closing LocalDB connection:", error)
      throw error
    }
  },
}

