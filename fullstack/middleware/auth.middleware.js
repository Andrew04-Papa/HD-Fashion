import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';

async function setupSqlite() {
  console.log('Setting up SQLite database...');
  
  try {
    // Tạo thư mục data nếu chưa tồn tại
    await fs.mkdir('./data', { recursive: true });
    
    // Mở kết nối đến cơ sở dữ liệu
    const db = await open({
      filename: './data/hd_fashion.sqlite',
      driver: sqlite3.Database
    });
    
    console.log('SQLite database connection established');
    
    // Tạo các bảng
    console.log('Creating tables...');
    
    // Bảng Users
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Email TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        IsAdmin INTEGER DEFAULT 0,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Bảng Categories
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Categories (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Slug TEXT UNIQUE NOT NULL,
        Description TEXT
      )
    `);
    
    // Bảng Products
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Products (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Slug TEXT UNIQUE NOT NULL,
        Description TEXT,
        Price REAL NOT NULL,
        OriginalPrice REAL,
        CategoryId INTEGER,
        SubcategoryId INTEGER,
        Featured INTEGER DEFAULT 0,
        Bestseller INTEGER DEFAULT 0,
        New INTEGER DEFAULT 0,
        Sale INTEGER DEFAULT 0,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
        FOREIGN KEY (SubcategoryId) REFERENCES Categories(Id)
      )
    `);
    
    // Bảng ProductImages
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ProductImages (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        ProductId INTEGER NOT NULL,
        ImageUrl TEXT NOT NULL,
        IsPrimary INTEGER DEFAULT 0,
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
      )
    `);
    
    // Bảng ProductVariants (sizes, colors)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ProductVariants (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        ProductId INTEGER NOT NULL,
        Size TEXT,
        Color TEXT,
        Stock INTEGER DEFAULT 0,
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
      )
    `);
    
    // Bảng ProductTags
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ProductTags (
        ProductId INTEGER NOT NULL,
        Tag TEXT NOT NULL,
        PRIMARY KEY (ProductId, Tag),
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
      )
    `);
    
    // Bảng Orders
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Orders (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        UserId INTEGER,
        Status TEXT NOT NULL,
        Total REAL NOT NULL,
        ShippingAddress TEXT,
        PaymentMethod TEXT NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
      )
    `);
    
    // Bảng OrderItems
    await db.exec(`
      CREATE TABLE IF NOT EXISTS OrderItems (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        OrderId INTEGER NOT NULL,
        ProductId INTEGER NOT NULL,
        Quantity INTEGER NOT NULL,
        Price REAL NOT NULL,
        Size TEXT,
        Color TEXT,
        FOREIGN KEY (OrderId) REFERENCES Orders(Id),
        FOREIGN KEY (ProductId) REFERENCES Products(Id)
      )
    `);
    
    console.log('All tables created successfully');
    
    // Thêm dữ liệu mẫu
    console.log('Adding sample data...');
    
    // Thêm người dùng admin
    await db.run(`
      INSERT OR IGNORE INTO Users (Name, Email, Password, IsAdmin)
      VALUES ('Admin User', 'admin@example.com', '$2a$10$JrIFn7xQPtAtwMKi.Zj5a.Y1Z9XOh1hBt8a0Vj.DxMrJuYbFwCTfe', 1)
    `); // Password: admin123
    
    // Thêm danh mục
    const categories = [
      { name: 'Men', slug: 'men', description: 'Men\'s fashion' },
      { name: 'Women', slug: 'women', description: 'Women\'s fashion' },
      { name: 'Accessories', slug: 'accessories', description: 'Fashion accessories' }
    ];
    
    for (const category of categories) {
      await db.run(`
        INSERT OR IGNORE INTO Categories (Name, Slug, Description)
        VALUES (?, ?, ?)
      `, [category.name, category.slug, category.description]);
    }
    
    console.log('Sample data added successfully');
    
    // Đóng kết nối
    await db.close();
    console.log('SQLite setup completed successfully');
    
    // Tạo file lib/db-sqlite.ts
    const dbTsContent = `import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db: any = null;

export const dbSqlite = {
  connect: async () => {
    try {
      if (!db) {
        console.log('Connecting to SQLite database...');
        db = await open({
          filename: './data/hd_fashion.sqlite',
          driver: sqlite3.Database
        });
        console.log('Connected to SQLite database successfully');
      }
      return db;
    } catch (error) {
      console.error('SQLite connection error:', error);
      throw error;
    }
  },

  query: async (sql: string, params: any[] = []) => {
    try {
      if (!db) {
        await dbSqlite.connect();
      }
      return await db.all(sql, params);
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  },

  get: async (sql: string, params: any[] = []) => {
    try {
      if (!db) {
        await dbSqlite.connect();
      }
      return await db.get(sql, params);
    } catch (error) {
      console.error('SQLite get error:', error);
      throw error;
    }
  },

  run: async (sql: string, params: any[] = []) => {
    try {
      if (!db) {
        await dbSqlite.connect();
      }
      return await db.run(sql, params);
    } catch (error) {
      console.error('SQLite run error:', error);
      throw error;
    }
  },

  close: async () => {
    try {
      if (db) {
        await db.close();
        db = null;
        console.log('SQLite connection closed');
      }
    } catch (error) {
      console.error('Error closing SQLite connection:', error);
      throw error;
    }
  }
};
`;
    
    await fs.writeFile('lib/db-sqlite.ts', dbTsContent);
    console.log('Created lib/db-sqlite.ts');
    
    // Tạo file test-sqlite.mjs
    const testSqliteContent = `import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function testSqliteConnection() {
  try {
    console.log('Testing SQLite connection...');
    
    const db = await open({
      filename: './data/hd_fashion.sqlite',
      driver: sqlite3.Database
    });
    
    console.log('Connected to SQLite database successfully');
    
    // Test query - get all tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Database tables:');
    console.table(tables);
    
    // Get users
    const users = await db.all('SELECT * FROM Users');
    console.log('Users:');
    console.table(users);
    
    // Close connection
    await db.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('SQLite connection error:', error);
  }
}

testSqliteConnection();
`;
    
    await fs.writeFile('test-sqlite.mjs', testSqliteContent);
    console.log('Created test-sqlite.mjs');
    
    // Tạo package.json với các dependencies cần thiết
    const packageJsonContent = `{
  "dependencies": {
    "sqlite3": "^5.1.6",
    "sqlite": "^5.0.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/sqlite3": "^3.1.8",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5"
  }
}`;
    
    await fs.writeFile('package-sqlite.json', packageJsonContent);
    console.log('Created package-sqlite.json');
    
    console.log('\nSQLite setup complete!');
    console.log('To use SQLite instead of SQL Server:');
    console.log('1. Install dependencies: npm install sqlite3 sqlite');
    console.log('2. Run test: node test-sqlite.mjs');
    console.log('3. Update your API routes to use the dbSqlite object from lib/db-sqlite.ts');
    
  } catch (error) {
    console.error('Error setting up SQLite:', error);
  }
}

setupSqlite();

