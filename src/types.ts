import { Request, Response } from "express";
import Redis from "ioredis";
import { EntityManager } from "typeorm";

export type GraphqlMyContext = {
  em: EntityManager;
  req: Request;
  res: Response;
  redis: Redis;
};

export enum GraphqlCustomErrorCode {
  CONFLICT = "CONFLICT",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export type CustomValidationError = {
  property: string;
  constraints: string[];
};
