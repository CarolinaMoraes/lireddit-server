import express from "express";
import cors from "cors";
import { json } from "body-parser";
import "reflect-metadata";

import { DataSource } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import dotenv from "dotenv";
import { ormConfig } from "./config/orm.config";

import RedisStore from "connect-redis";
import session from "express-session";
import Redis from "ioredis";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { postTypeDef } from "./graphql/schemas/post";
import { postResolvers } from "./graphql/resolvers/post";
import { userTypeDef } from "./graphql/schemas/user";
import { userResolvers } from "./graphql/resolvers/user";
import { GraphqlMyContext } from "./types";
import { isAuthenticated } from "./middleware/isAuthenticated";

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

  const redisClient = new Redis();

  const app = express();
  app.use(express.json());

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
      secret: process.env.REDIS_SECRET || "",
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

        // Check if the user is logged and if they aren't the request won't go forward
        isAuthenticated(req);

        return { em: AppDataSource.manager, req, res, redis: redisClient };
      },
    })
  );

  app.listen(process.env.SERVER_PORT || 4000, () => {
    console.log(`Listening on port ${process.env.PORT || 4000}`);
  });
}

main();
