import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { __prod__ } from "../constants";
import { Post } from "../entities/Post";
import { User } from "../entities/User";

const postgresOrmConfig: PostgresConnectionOptions = {
  type: "postgres",
  synchronize: false,
  host: __prod__ ? process.env.DB_HOST : "localhost",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  logging: !__prod__,
  entities: [Post, User],
  migrations: ["src/migrations/**/*{.ts,.js}"],
  subscribers: ["dist/subscribers/**/*{.ts,.js}"],
  migrationsRun: true,
};

export const ormConfig = postgresOrmConfig;
