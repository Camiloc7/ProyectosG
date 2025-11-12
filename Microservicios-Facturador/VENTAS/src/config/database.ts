import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST,
    dialect: "mysql", // Especifica MySQL como base de datos
    logging: false, // Desactiva logs de SQL en consola
  }
);

// Probar conexión
// Solo conectar si no estamos en modo de test
if (process.env.NODE_ENV !== "test") {
  sequelize
    .authenticate()
    .then(() => console.log("✅ Conexión a MySQL establecida correctamente."))
    .catch((err) =>
      console.error("❌ Error conectando a la base de datos:", err)
    );
}
