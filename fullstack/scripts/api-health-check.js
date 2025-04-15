const fetch = require("node-fetch")

async function checkApiHealth() {
  console.log("Checking API health...")

  try {
    // Test the test endpoint
    console.log("\nTesting /api/test endpoint:")
    const testResponse = await fetch("http://localhost:3000/api/test")
    console.log("Status:", testResponse.status)
    console.log("Content-Type:", testResponse.headers.get("content-type"))
    console.log("Response:", await testResponse.json())

    // Test the login endpoint with invalid credentials
    console.log("\nTesting /api/auth/login endpoint with invalid credentials:")
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
    })
    console.log("Status:", loginResponse.status)
    console.log("Content-Type:", loginResponse.headers.get("content-type"))

    try {
      const loginData = await loginResponse.json()
      console.log("Response:", loginData)
    } catch (error) {
      console.error("Failed to parse login response as JSON")
      const text = await loginResponse.text()
      console.log("Raw response:", text.substring(0, 200) + "...")
    }

    // Test the me endpoint
    console.log("\nTesting /api/auth/me endpoint:")
    const meResponse = await fetch("http://localhost:3000/api/auth/me")
    console.log("Status:", meResponse.status)
    console.log("Content-Type:", meResponse.headers.get("content-type"))

    try {
      const meData = await meResponse.json()
      console.log("Response:", meData)
    } catch (error) {
      console.error("Failed to parse me response as JSON")
      const text = await meResponse.text()
      console.log("Raw response:", text.substring(0, 200) + "...")
    }

    console.log("\nAPI health check completed.")
  } catch (error) {
    console.error("API health check failed:", error)
  }
}

checkApiHealth()

