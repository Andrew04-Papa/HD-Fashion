const db = require("./config/db")

async function testDatabaseConnection() {
  try {
    console.log("Iniciando prueba de conexión a la base de datos...")

    // Intentar conectar
    await db.connect()
    console.log("Conexión establecida correctamente")

    // Probar una consulta simple
    const result = await db.query("SELECT @@VERSION AS Version")
    console.log("Versión de SQL Server:")
    console.log(result.recordset[0].Version)

    // Probar si existe la base de datos
    try {
      const dbResult = await db.query(`
        SELECT name FROM master.dbo.sysdatabases WHERE name = 'hd_fashion'
      `)

      if (dbResult.recordset.length === 0) {
        console.log('La base de datos "hd_fashion" no existe. Debes crearla manualmente.')
      } else {
        console.log('La base de datos "hd_fashion" existe.')

        // Verificar tablas
        const tablesResult = await db.query(`
          SELECT TABLE_NAME 
          FROM hd_fashion.INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE'
        `)

        console.log("Tablas en la base de datos:")
        console.table(tablesResult.recordset)
      }
    } catch (dbError) {
      console.error("Error al verificar la base de datos:", dbError.message)
    }

    // Cerrar conexión
    await db.close()
    console.log("Prueba completada")
  } catch (error) {
    console.error("Error en la prueba de conexión:", error.message)
  }
}

// Ejecutar la prueba
testDatabaseConnection()

