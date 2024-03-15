import { CreateUserInput } from "../../entities/DTO/CreateUserInput";
import { User } from "../../entities/User";
import { GraphqlMyContext } from "../../types";
import argon2 from "argon2";
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphqlCustomErrorCode } from "../../types";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { getValidatorErrors } from "../../utils";
import { COOKIE_NAME } from "../../constants";
import { LoginUserInput } from "../../entities/DTO/LoginUserInput";

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
      args: { userInput: CreateUserInput },
      { em, req }: GraphqlMyContext
    ): Promise<User> => {
      const { userInput } = args;

      const errors = await validate(plainToClass(CreateUserInput, userInput));

      if (errors.length > 0) {
        throw new GraphQLError("Invalid input", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
            validations: getValidatorErrors(errors),
          },
        });
      }

      const alreadyStoredUser = await em
        .getRepository(User)
        .createQueryBuilder("user")
        .where("user.username = :username", {
          username: userInput.username,
        })
        .orWhere("user.email = :email", { email: userInput.email })
        .getOne();

      if (alreadyStoredUser) {
        throw new GraphQLError("User already exists", {
          extensions: {
            code: GraphqlCustomErrorCode.CONFLICT,
            validations: [
              {
                property: "username",
                constraints: ["User already exists"],
              },
            ],
          },
        });
      }

      const hashedPass = await argon2.hash(userInput.password);

      const user = await em.save(User, {
        username: userInput.username,
        password: hashedPass,
        email: userInput.email
      });

      // store user id session
      // this will set a cookie on the user and keep them logged in
      req.session.userId = user.id;

      return user;
    },
    login: async (
      _: unknown,
      args: { userInput: LoginUserInput },
      { em, req }: GraphqlMyContext
    ): Promise<User> => {
      const { userInput } = args;

      const errors = await validate(plainToClass(LoginUserInput, userInput));

      if (errors.length > 0) {
        throw new GraphQLError("Invalid input", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
            validations: getValidatorErrors(errors),
          },
        });
      }

      const user = await em
        .getRepository(User)
        .createQueryBuilder("user")
        .where("user.username = :username", {
          username: userInput.usernameOrEmail,
        })
        .orWhere("user.email = :email", { email: userInput.usernameOrEmail })
        .getOne();

      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: GraphqlCustomErrorCode.NOT_FOUND,
            validations: [
              {
                property: "username",
                constraints: ["Username doesn't exist"],
              },
            ],
          },
        });
      }

      if (!(await argon2.verify(user.password, userInput.password))) {
        throw new GraphQLError("Incorrect password", {
          extensions: {
            code: GraphqlCustomErrorCode.UNAUTHORIZED,
            validations: [
              {
                property: "password",
                constraints: ["Incorrect password"],
              },
            ],
          },
        });
      }

      // store user id session
      // this will set a cookie on the user and keep them logged in
      req.session.userId = user.id;

      return user;
    },
    logout: (_: unknown, args: {}, { req, res }: GraphqlMyContext) => {
      return new Promise((resolve) => {
        req.session.destroy((err) => {
          res.clearCookie(COOKIE_NAME);
          if (err) {
            resolve(false);
            return;
          }

          resolve(true);
        });
      });
    },
    forgotPassword: async (
      _: unknown,
      args: { email: string },
      { req, res, em }: GraphqlMyContext
    ) => {
      // const user = await em.findOne(User, {});
      return true;
    },
  },
};
