import express from "express";
import cors from "cors";
import { json } from "body-parser";
import "reflect-metadata";

import { DataSource } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import dotenv from "dotenv";
import { ormConfig } from "./config/orm.config";

import RedisStore from "connect-redis";
import session, { Store } from "express-session";
import { createClient } from "redis";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { postTypeDef } from "./graphql/schemas/post";
import { postResolvers } from "./graphql/resolvers/post";
import { userTypeDef } from "./graphql/schemas/user";
import { userResolvers } from "./graphql/resolvers/user";
import { GraphqlMyContext } from "./types";
import { sendEmail } from "./utils/sendEmail";
import { User } from "./entities/User";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

dotenv.config();

export const AppDataSource = new DataSource(ormConfig);

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("Data source has been initialized!");
  } catch (error) {
    console.error("Error during Data source initialization", error);
  }

  const redisClient = createClient();
  redisClient.connect().catch(console.error);

  const app = express();

  // Should run before ApolloMiddleware
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redisClient,
        prefix: "lireddit:",
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prod__, // cookie only works in https
        sameSite: "lax",
      },
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: "M5nYQVKwzFYuzcyI7HwkZ3sl5GDaXues",
    })
  );

  const apolloServer = new ApolloServer({
    typeDefs: [postTypeDef, userTypeDef],
    resolvers: [postResolvers, userResolvers],
  });

  await apolloServer.start();

  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
    })
  );

  app.use(
    "/graphql",
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }): Promise<GraphqlMyContext> => {
        return { em: AppDataSource.manager, req, res };
      },
    })
  );

  app.listen(4000, () => {
    console.log("Listening on port 4000");
  });
}

main();
