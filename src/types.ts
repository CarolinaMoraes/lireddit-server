import { Request, Response } from "express";
import { EntityManager } from "typeorm";

export type GraphqlMyContext = {
  em: EntityManager;
  req: Request;
  res: Response;
};

export enum GraphqlCustomErrorCode {
  CONFLICT = "CONFLICT",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
}
