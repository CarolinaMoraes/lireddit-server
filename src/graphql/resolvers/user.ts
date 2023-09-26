import { CreateAndLoginUserInput } from "../../entities/DTO/CreateAndLoginUserInput";
import { User } from "../../entities/User";
import { GraphqlMyContext } from "../../types";
import argon2 from "argon2";
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphqlCustomErrorCode } from "../../types";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { getConstraintMessagesFromValidatorErrors } from "../../utils";

export const userResolvers = {
  Mutation: {
    register: async (
      _: unknown,
      args: { userInput: CreateAndLoginUserInput },
      contextValue: GraphqlMyContext
    ): Promise<User> => {
      const { userInput } = args;

      const errors = await validate(
        plainToClass(CreateAndLoginUserInput, userInput)
      );

      if (errors.length > 0) {
        throw new GraphQLError(
          getConstraintMessagesFromValidatorErrors(errors),
          {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          }
        );
      }

      const alreadyStoredUser = await contextValue.em.findOne(User, {
        where: { username: userInput.username },
      });

      if (alreadyStoredUser) {
        throw new GraphQLError("User already exists", {
          extensions: { code: GraphqlCustomErrorCode.CONFLICT },
        });
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

      const errors = await validate(
        plainToClass(CreateAndLoginUserInput, userInput)
      );

      if (errors.length > 0) {
        throw new GraphQLError(
          getConstraintMessagesFromValidatorErrors(errors),
          {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          }
        );
      }

      const user = await contextValue.em.findOne(User, {
        where: { username: userInput.username },
      });

      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: GraphqlCustomErrorCode.NOT_FOUND,
          },
        });
      }

      if (!(await argon2.verify(user.password, userInput.password))) {
        throw new GraphQLError("Incorrect password", {
          extensions: { code: GraphqlCustomErrorCode.UNAUTHORIZED },
        });
      }

      return user;
    },
  },
};
