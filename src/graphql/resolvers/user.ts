import { CreateAndLoginUserInput } from "../../entities/DTO/CreateAndLoginUserInput";
import { User } from "../../entities/User";
import { GraphqlMyContext } from "../../types";
import argon2 from "argon2";
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphqlCustomErrorCode } from "../../types";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { getValidatorErrors } from "../../utils";

export const userResolvers = {
  Query: {
    me: async (
      _: unknown,
      args: {},
      { req, em }: GraphqlMyContext
    ): Promise<User | null> => {
      if (!req.session.userId) return null;

      const user = em.findOne(User, {
        where: { id: req.session.userId },
      });

      return user;
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: { userInput: CreateAndLoginUserInput },
      { em, req }: GraphqlMyContext
    ): Promise<User> => {
      const { userInput } = args;

      const errors = await validate(
        plainToClass(CreateAndLoginUserInput, userInput)
      );

      console.log(errors);

      if (errors.length > 0) {
        throw new GraphQLError("Invalid input", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
            validations: getValidatorErrors(errors),
          },
        });
      }

      const alreadyStoredUser = await em.findOne(User, {
        where: { username: userInput.username },
      });

      if (alreadyStoredUser) {
        throw new GraphQLError("User already exists", {
          extensions: { code: GraphqlCustomErrorCode.CONFLICT },
        });
      }

      const hashedPass = await argon2.hash(userInput.password);

      const user = await em.save(User, {
        username: userInput.username,
        password: hashedPass,
      });

      // store user id session
      // this will set a cookie on the user and keep them logged in
      req.session.userId = user.id;

      return user;
    },
    login: async (
      _: unknown,
      args: { userInput: CreateAndLoginUserInput },
      { em, req }: GraphqlMyContext
    ): Promise<User> => {
      const { userInput } = args;

      const errors = await validate(
        plainToClass(CreateAndLoginUserInput, userInput)
      );

      if (errors.length > 0) {
        throw new GraphQLError("Invalid input", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
            validations: getValidatorErrors(errors),
          },
        });
      }

      const user = await em.findOne(User, {
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

      // store user id session
      // this will set a cookie on the user and keep them logged in
      req.session.userId = user.id;

      return user;
    },
  },
};
