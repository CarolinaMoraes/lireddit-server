import { EntityManager } from "typeorm";

export type GraphqlMyContext = {
  em: EntityManager;
};
