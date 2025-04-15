import { promises as fs } from "fs"
import path from "path"
import bcrypt from "bcryptjs"

// Interface for query result
interface QueryResult {
  recordset: any[]
  rowsAffected: number[]
}

// Interface for user data
interface User {
  Id: number
  Name: string
  Email: string
  Password: string
  IsAdmin: boolean
  CreatedAt: string
}

// In-memory database storage
const inMemoryDb: Record<string, any[]> = {
  Users: [] as User[],
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (error) {
    console.error("Error creating data directory:", error)
  }
}

// Save data to file
async function saveData() {
  try {
    await ensureDataDir()
    const dataPath = path.join(process.cwd(), "data", "db.json")
    await fs.writeFile(dataPath, JSON.stringify(inMemoryDb, null, 2))
  } catch (error) {
    console.error("Error saving data:", error)
  }
}

// Load data from file
async function loadData() {
  try {
    await ensureDataDir()
    const dataPath = path.join(process.cwd(), "data", "db.json")
    try {
      const data = await fs.readFile(dataPath, "utf8")
      Object.assign(inMemoryDb, JSON.parse(data))
    } catch (error) {
      // File doesn't exist or is invalid, use default empty database
      console.log("No existing data file found, using default empty database")
    }

    // Add demo user if database is empty or doesn't have the demo user
    const demoUserExists = inMemoryDb.Users.some((user) => user.Email === "admin@example.com")
    if (!demoUserExists) {
      // Hash password for demo user
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      inMemoryDb.Users.push({
        Id: 1,
        Name: "Admin User",
        Email: "admin@example.com",
        Password: hashedPassword,
        IsAdmin: true,
        CreatedAt: new Date().toISOString(),
      })
      console.log("Added demo user: admin@example.com / admin123")
      saveData()
    }
  } catch (error) {
    console.error("Error loading data:", error)
  }
}

// Initialize data
loadData()

export const dbFallback = {
  query: async (query: string, params: any[] = []): Promise<QueryResult> => {
    console.log("Using in-memory fallback database")
    console.log("Query:", query)
    console.log("Params:", params)

    // Special handling for demo account
    if (
      query.toUpperCase().includes("SELECT") &&
      query.toUpperCase().includes("FROM USERS WHERE EMAIL =") &&
      params[0] === "admin@example.com"
    ) {
      // Ensure demo user exists
      const demoUser = inMemoryDb.Users.find((user) => user.Email === "admin@example.com")
      if (!demoUser) {
        // Create demo user if it doesn't exist
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash("admin123", salt)

        const newDemoUser = {
          Id: 1,
          Name: "Admin User",
          Email: "admin@example.com",
          Password: hashedPassword,
          IsAdmin: true,
          CreatedAt: new Date().toISOString(),
        }

        inMemoryDb.Users.push(newDemoUser)
        await saveData()

        return { recordset: [newDemoUser], rowsAffected: [1] }
      }

      return { recordset: [demoUser], rowsAffected: [1] }
    }

    // Handle basic query types
    if (query.toUpperCase().includes("SELECT") && query.toUpperCase().includes("FROM USERS WHERE EMAIL =")) {
      const emailParam: string = params[0]
      console.log("Searching for user with email:", emailParam)
      const users = inMemoryDb.Users.filter((user) => user.Email === emailParam)
      console.log("Found users:", users.length)
      return { recordset: users, rowsAffected: [users.length] }
    }

    if (query.toUpperCase().includes("INSERT INTO") && query.toUpperCase().includes("USERS")) {
      // Handle user registration
      let name = ""
      let email = ""
      let password = ""
      let isAdmin = 0

      // Check if it's an OUTPUT query
      const isOutputQuery = query.toUpperCase().includes("OUTPUT INSERTED")

      // Get parameters from params array
      if (params && params.length >= 3) {
        name = params[0]
        email = params[1]
        password = params[2]
        if (params.length > 3) {
          isAdmin = params[3]
        }
      }

      // Check if email already exists
      const existingUser = inMemoryDb.Users.find((user) => user.Email === email)
      if (existingUser) {
        throw new Error("Email already exists")
      }

      // Create new ID
      const id = inMemoryDb.Users.length > 0 ? Math.max(...inMemoryDb.Users.map((u) => u.Id)) + 1 : 1

      // Create new user
      const newUser: User = {
        Id: id,
        Name: name,
        Email: email,
        Password: password,
        IsAdmin: isAdmin === 1,
        CreatedAt: new Date().toISOString(),
      }

      // Add to list
      inMemoryDb.Users.push(newUser)
      console.log("Created new user:", email)

      // Save data
      await saveData()

      // If OUTPUT query, return inserted user data
      if (isOutputQuery) {
        return {
          recordset: [
            {
              Id: newUser.Id,
              Name: newUser.Name,
              Email: newUser.Email,
              IsAdmin: newUser.IsAdmin,
            },
          ],
          rowsAffected: [1],
        }
      } else {
        // If not OUTPUT, just return affected rows
        return { recordset: [], rowsAffected: [1] }
      }
    }

    if (query.toUpperCase().includes("UPDATE USERS SET PASSWORD") && query.toUpperCase().includes("WHERE EMAIL =")) {
      const password = params[0]
      const email = params[1]

      // Find user by email
      const userIndex = inMemoryDb.Users.findIndex((user) => user.Email === email)

      if (userIndex !== -1) {
        // Update password
        inMemoryDb.Users[userIndex].Password = password
        console.log(`Updated password for user: ${email}`)

        // Save data
        await saveData()

        return { recordset: [], rowsAffected: [1] }
      } else {
        return { recordset: [], rowsAffected: [0] }
      }
    }

    if (query.toUpperCase().includes("SELECT") && query.toUpperCase().includes("FROM USERS WHERE ID =")) {
      const id = params[0]
      const users = inMemoryDb.Users.filter((user) => user.Id === id || user.Id === Number.parseInt(id))
      return { recordset: users, rowsAffected: [users.length] }
    }

    // Handle SELECT 1 query (connection test)
    if (query.trim() === "SELECT 1") {
      return { recordset: [{ "1": 1 }], rowsAffected: [1] }
    }

    // Return empty result for other queries
    return { recordset: [], rowsAffected: [0] }
  },

  ensureTables: async (): Promise<boolean> => {
    console.log("Ensuring tables in fallback database")
    // Ensure Users table exists
    if (!inMemoryDb.Users) {
      inMemoryDb.Users = []
    }

    // Add demo user if database is empty or doesn't have the demo user
    const demoUserExists = inMemoryDb.Users.some((user) => user.Email === "admin@example.com")
    if (!demoUserExists) {
      // Hash password for demo user
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      inMemoryDb.Users.push({
        Id: 1,
        Name: "Admin User",
        Email: "admin@example.com",
        Password: hashedPassword,
        IsAdmin: true,
        CreatedAt: new Date().toISOString(),
      })
      console.log("Added demo user: admin@example.com / admin123")
      saveData()
    }

    return true
  },

  userExists: async (email: string): Promise<boolean> => {
    // Special handling for demo account
    if (email === "admin@example.com") {
      const demoUserExists = inMemoryDb.Users.some((user) => user.Email === "admin@example.com")
      if (!demoUserExists) {
        // Create demo user if it doesn't exist
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash("admin123", salt)

        inMemoryDb.Users.push({
          Id: 1,
          Name: "Admin User",
          Email: "admin@example.com",
          Password: hashedPassword,
          IsAdmin: true,
          CreatedAt: new Date().toISOString(),
        })
        await saveData()
      }
      return true
    }

    return inMemoryDb.Users.some((user) => user.Email === email)
  },
}

