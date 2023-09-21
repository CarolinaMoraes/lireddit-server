import { EntityManager } from "typeorm";

export type GraphqlMyContext = {
  em: EntityManager;
};

export enum GraphqlCustomErrorCode {
  CONFLICT = "CONFLICT",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
}
