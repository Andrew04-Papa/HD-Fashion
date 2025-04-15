import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import sql from "mssql"
import next from "next"

// Load environment variables
dotenv.config({ path: ".env.local" })

// Determine if we're in development or production
const dev = process.env.NODE_ENV !== "production"
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

// SQL Server configuration
const sqlConfig = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "sa",
  server: process.env.DB_SERVER || "DESKTOP-I8F0ORT\\ANDREW", // Your specific server name
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
}

// Global SQL Server pool
let pool = null

// Error middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode)
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  })
}

// Initialize database connection
const connectToDatabase = async () => {
  try {
    console.log("Connecting to SQL Server...")
    console.log(`Server: ${sqlConfig.server}, Database: ${sqlConfig.database}`)

    pool = await new sql.ConnectionPool(sqlConfig).connect()
    console.log("Connected to SQL Server successfully")
    return pool
  } catch (error) {
    console.error("SQL Server connection error:", error)
    throw error
  }
}

// Initialize application
const initializeApp = async () => {
  try {
    // Connect to database
    await connectToDatabase()

    // Check if database exists and create it if it doesn't
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = '${sqlConfig.database}')
        BEGIN
          CREATE DATABASE ${sqlConfig.database}
          PRINT 'Database ${sqlConfig.database} created successfully'
        END
        ELSE
        BEGIN
          PRINT 'Database ${sqlConfig.database} already exists'
        END
      `)

      // Use the database
      await pool.request().query(`USE ${sqlConfig.database}`)

      // Check if Users table exists and create it if it doesn't
      await pool.request().query(`
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

      console.log("Database schema initialized successfully")
    } catch (error) {
      console.error("Error initializing database schema:", error)
    }

    // Initialize express app
    const app = express()

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again after 15 minutes",
    })

    // Middleware
    app.use(
      cors({
        origin: process.env.FRONTEND_URL || "*",
        credentials: true,
      }),
    )
    app.use(
      helmet({
        contentSecurityPolicy: false, // Disable CSP for Next.js development
      }),
    )
    app.use(morgan("dev"))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(limiter)

    // Static files
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    app.use("/uploads", express.static(path.join(__dirname, "uploads")))

    // Make SQL pool available to routes
    app.use((req, res, next) => {
      req.db = pool
      next()
    })

    // Import routes dynamically
    try {
      // Auth routes
      const { default: authRoutes } = await import("./routes/auth.routes.js")
      app.use("/api/auth", authRoutes)

      // Try to import other routes if they exist
      try {
        const { default: productRoutes } = await import("./routes/product.routes.js")
        app.use("/api/products", productRoutes)
      } catch (error) {
        console.log("Product routes not found, skipping...")
      }

      try {
        const { default: categoryRoutes } = await import("./routes/category.routes.js")
        app.use("/api/categories", categoryRoutes)
      } catch (error) {
        console.log("Category routes not found, skipping...")
      }

      try {
        const { default: cartRoutes } = await import("./routes/cart.routes.js")
        app.use("/api/cart", cartRoutes)
      } catch (error) {
        console.log("Cart routes not found, skipping...")
      }

      try {
        const { default: orderRoutes } = await import("./routes/order.routes.js")
        app.use("/api/orders", orderRoutes)
      } catch (error) {
        console.log("Order routes not found, skipping...")
      }

      try {
        const { default: addressRoutes } = await import("./routes/address.routes.js")
        app.use("/api/addresses", addressRoutes)
      } catch (error) {
        console.log("Address routes not found, skipping...")
      }

      try {
        const { default: aiRoutes } = await import("./routes/ai.routes.js")
        app.use("/api/ai", aiRoutes)
      } catch (error) {
        console.log("AI routes not found, skipping...")
      }
    } catch (error) {
      console.error("Error loading routes:", error)
    }

    // Prepare Next.js
    await nextApp.prepare()

    // Handle all other requests with Next.js
    app.all("*", (req, res) => {
      return handle(req, res)
    })

    // Error handling middleware
    app.use(notFound)
    app.use(errorHandler)

    // Start server
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`)
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:" + PORT}`)
    })

    return app
  } catch (error) {
    console.error("Failed to initialize application:", error)
    process.exit(1)
  }
}

// Process termination handler
process.on("SIGINT", async () => {
  console.log("Closing SQL Server connection pool...")
  if (pool) {
    await pool.close()
  }
  console.log("SQL Server connection pool closed")
  process.exit(0)
})

// Start the application
initializeApp()

// For testing purposes
export default initializeApp

