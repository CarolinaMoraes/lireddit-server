import { CreateAndLoginUserInput } from "../../entities/DTO/CreateAndLoginUserInput";
import { User } from "../../entities/User";
import { GraphqlMyContext } from "../../types";
import argon2 from "argon2";

export const userResolvers = {
  Mutation: {
    register: async (
      _: unknown,
      args: { userInput: CreateAndLoginUserInput },
      contextValue: GraphqlMyContext
    ): Promise<User> => {
      const { userInput } = args;

      const alreadyStoredUser = await contextValue.em.findOne(User, {
        where: { username: userInput.username },
      });

      if (alreadyStoredUser) {
        throw new Error("User already exists");
      }

      const hashedPass = await argon2.hash(userInput.password);

      return contextValue.em.save(User, {
        username: userInput.username,
        password: hashedPass,
      });
    },
    login: async (
      _: unknown,
      args: { userInput: CreateAndLoginUserInput },
      contextValue: GraphqlMyContext
    ): Promise<User> => {
      const { userInput } = args;

      const user = await contextValue.em.findOne(User, {
        where: { username: userInput.username },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (!(await argon2.verify(user.password, userInput.password))) {
        throw new Error("Credentials are invalid");
      }

      return user;
    },
  },
};
