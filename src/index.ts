import express from "express";
import cors from "cors";
import { json } from "body-parser";
import "reflect-metadata";

import { DataSource } from "typeorm";
import { __prod__ } from "./constants";
import dotenv from "dotenv";
import { ormConfig } from "./config/orm.config";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { postTypeDef } from "./graphql/schemas/post";
import { postResolvers } from "./graphql/resolvers/post";
import { userTypeDef } from "./graphql/schemas/user";
import { userResolvers } from "./graphql/resolvers/user";

dotenv.config();

export const AppDataSource = new DataSource(ormConfig);

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("Data source has been initialized!");
  } catch (error) {
    console.error("Error during Data source initialization", error);
  }

  const app = express();

  const apolloServer = new ApolloServer({
    typeDefs: [postTypeDef, userTypeDef],
    resolvers: [postResolvers, userResolvers],
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apolloServer, {
      context: async (_) => {
        return { em: AppDataSource.manager };
      },
    })
  );

  app.listen(4000, () => {
    console.log("Listening on port 4000");
  });
}

main();
