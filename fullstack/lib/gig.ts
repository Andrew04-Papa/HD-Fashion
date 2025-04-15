import sql from "mssql";

let db: sql.ConnectionPool | null = null;

export const sqlServerDb = {
  connect: async () => {
    if (!db) {
      console.log("Connecting to SQL Server database...");
      
      // SQL Server connection information
      const config = {
        user: "sa",               
        password: "sa",           
        server: "DESKTOP-I8FOORT", 
        database: "hd_fashion",    
        options: {
          encrypt: true,           
          trustServerCertificate: true,
        },
      };

      db = await sql.connect(config);
    }

    // Check connection
    const result = await db.request().query("SELECT 1 AS test");
    console.log(result);

    return db;
  }
};
