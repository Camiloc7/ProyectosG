import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env") });
const config: TypeOrmModuleOptions = {
    type: "mysql", 
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "sistema_pos",
    entities: [__dirname + "/**/*.entity{.ts,.js}"],
    synchronize: true, 
    logging: process.env.NODE_ENV !== "production",
    extra: {
        decimalAsNumber: true
    }
};

export default config;




// import { TypeOrmModuleOptions } from "@nestjs/typeorm";
// import * as dotenv from "dotenv";
// import { resolve } from "path";

// // dotenv.config({ path: resolve(__dirname, "../.env") });
// dotenv.config();
// // dotenv.config({ path: process.cwd() + '/.env' });

// const config: TypeOrmModuleOptions = {
//   type: "mysql",
//   host: process.env.DB_HOST || "localhost",
//   port: parseInt(process.env.DB_PORT || "3306", 10),
//   username: process.env.DB_USERNAME || "root",
//   password: process.env.DB_PASSWORD || "password",
//   database: process.env.DB_DATABASE || "sistema_pos",
//   entities: [__dirname + "/**/*.entity{.ts,.js}"],
//   synchronize: true,
//   // synchronize: process.env.NODE_ENV !== "production",
//   logging: process.env.NODE_ENV !== "production",
//   extra: {
//   decimalAsNumber: true
//   }
// };

// export default config;
