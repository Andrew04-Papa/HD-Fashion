const db = require("./config/db")
const fs = require("fs")
const path = require("path")

async function setupDatabase() {
  try {
    console.log("Iniciando configuración de la base de datos...")

    // Conectar a SQL Server
    await db.connect()

    // Verificar si existe la base de datos
    const dbResult = await db.query(`
      SELECT name FROM master.dbo.sysdatabases WHERE name = 'hd_fashion'
    `)

    // Crear la base de datos si no existe
    if (dbResult.recordset.length === 0) {
      console.log('Creando base de datos "hd_fashion"...')
      await db.query("CREATE DATABASE hd_fashion")
      console.log("Base de datos creada correctamente")
    } else {
      console.log('La base de datos "hd_fashion" ya existe')
    }

    // Cambiar a la base de datos hd_fashion
    await db.query("USE hd_fashion")

    // Crear tablas
    console.log("Creando tablas...")

    // Tabla Users
    await db.query(`
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

    // Tabla Categories
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' AND xtype='U')
      CREATE TABLE Categories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Slug NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(MAX)
      )
    `)

    // Tabla Products
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
      CREATE TABLE Products (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        Slug NVARCHAR(255) NOT NULL UNIQUE,
        Description NVARCHAR(MAX),
        Price DECIMAL(10, 2) NOT NULL,
        OriginalPrice DECIMAL(10, 2),
        CategoryId INT,
        Featured BIT DEFAULT 0,
        Bestseller BIT DEFAULT 0,
        New BIT DEFAULT 0,
        Sale BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
      )
    `)

    // Tabla ProductImages
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductImages' AND xtype='U')
      CREATE TABLE ProductImages (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProductId INT NOT NULL,
        ImageUrl NVARCHAR(255) NOT NULL,
        IsPrimary BIT DEFAULT 0,
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
      )
    `)

    // Tabla ProductVariants
    await db.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductVariants' AND xtype='U')
      CREATE TABLE ProductVariants (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProductId INT NOT NULL,
        Size NVARCHAR(50),
        Color NVARCHAR(50),
        Stock INT DEFAULT 0,
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
      )
    `)

    console.log("Tablas creadas correctamente")

    // Insertar datos de ejemplo
    console.log("Insertando datos de ejemplo...")

    // Insertar categorías
    const categories = [
      { name: "Men", slug: "men", description: "Men's fashion" },
      { name: "Women", slug: "women", description: "Women's fashion" },
      { name: "Accessories", slug: "accessories", description: "Fashion accessories" },
    ]

    for (const category of categories) {
      await db.query(
        `
        IF NOT EXISTS (SELECT * FROM Categories WHERE Slug = @param0)
        INSERT INTO Categories (Name, Slug, Description)
        VALUES (@param1, @param0, @param2)
      `,
        [category.slug, category.name, category.description],
      )
    }

    // Insertar usuario admin
    await db.query(
      `
      IF NOT EXISTS (SELECT * FROM Users WHERE Email = @param0)
      INSERT INTO Users (Name, Email, Password, IsAdmin)
      VALUES (@param1, @param0, @param2, 1)
    `,
      ["admin@example.com", "Admin User", "$2a$10$JrIFn7xQPtAtwMKi.Zj5a.Y1Z9XOh1hBt8a0Vj.DxMrJuYbFwCTfe"],
    ) // Password: admin123

    console.log("Datos de ejemplo insertados correctamente")

    // Cerrar conexión
    await db.close()
    console.log("Configuración de la base de datos completada")
  } catch (error) {
    console.error("Error en la configuración de la base de datos:", error.message)
  }
}

// Ejecutar la configuración
setupDatabase()

