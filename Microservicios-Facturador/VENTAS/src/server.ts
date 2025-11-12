import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.routes";
import { sequelize } from "./models";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(router);

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Las tablas han sido sincronizadas correctamente.");
  })
  .catch((err) => {
    console.error("Error sincronizando las tablas:", err);
  });

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export { app, server };
