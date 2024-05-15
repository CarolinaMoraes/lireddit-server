import { Request, Response, NextFunction } from "express";
import { GraphQLError } from "graphql";
import { GraphqlCustomErrorCode } from "../types";

export const isAuthenticated = (
  req: Request,
): void => {
  const insecureOperations = ["register", "login", "forgotpassword"];

  if (req.headers.referer?.includes(`${process.env.SERVER_PORT}/graphql`) ||
    !req.body ||
    !req.body.operationName ||
    insecureOperations.includes(req.body.operationName.toLowerCase())) {
    return;
  }

  if (!req.session.userId) {
    console.log("[MIDDLEWARE INTERCEPTION]: Not authenticated");
    throw new GraphQLError("Not authenticated", {
      extensions: {
        code: GraphqlCustomErrorCode.UNAUTHORIZED,
      },
    });
  }
};
