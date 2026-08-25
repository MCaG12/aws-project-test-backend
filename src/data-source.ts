import { DataSource } from "typeorm";
import "dotenv/config";
import { canvasSnapShot } from "./entities/canvasSnapShot";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,     
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [canvasSnapShot], 
  migrations: [__dirname + "/migrations/**/*.ts"],
});