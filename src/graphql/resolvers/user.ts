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
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../../constants";
import { LoginUserInput } from "../../entities/DTO/LoginUserInput";
import { sendEmail } from "../../utils/sendEmail";
import { v4 } from "uuid";

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
        email: userInput.email,
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
            code: ApolloServerErrorCode.BAD_USER_INPUT,
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
      { req, res, em, redis }: GraphqlMyContext
    ) => {
      const user = await em.findOne(User, { where: { email: args.email } });

      if (!user) {
        throw new GraphQLError("Invalid email", {
          extensions: {
            code: GraphqlCustomErrorCode.NOT_FOUND,
            validations: [
              {
                property: "email",
                constraints: ["No user found with this email"],
              },
            ],
          },
        });
      }

      const token = v4();

      await redis.set(
        FORGOT_PASSWORD_PREFIX + token,
        user.id,
        "EX",
        1000 * 60 * 60 * 24 * 3 // 3 days
      );

      await sendEmail(
        args.email,
        `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`
      );

      return true;
    },
    changePassword: async (
      _: unknown,
      args: { token: string; newPassword: string },
      { req, res, em, redis }: GraphqlMyContext
    ): Promise<User> => {
      if (args.newPassword.length < 8) {
        throw new GraphQLError("Invalid input", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
            validations: [
              {
                property: "newPassword",
                constraints: ["Password must have at least 8 characters"],
              },
            ],
          },
        });
      }

      const redisKey = FORGOT_PASSWORD_PREFIX + args.token;
      const userId = await redis.get(redisKey);

      if (!userId) {
        throw new GraphQLError("Invalid input", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
            validations: [
              {
                property: "token",
                constraints: [
                  "The request for this password change has expired",
                ],
              },
            ],
          },
        });
      }

      const user = await em.findOne(User, { where: { id: parseInt(userId) } });

      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: GraphqlCustomErrorCode.NOT_FOUND,
            validations: [
              {
                property: "username",
                constraints: ["User no longer exists"],
              },
            ],
          },
        });
      }

      user.password = await argon2.hash(args.newPassword);

      await em.save(user);

      // removing this key from redis ensuring that the user can't use the same token again
      // to change their password
      await redis.del(redisKey);

      // login the user after change password
      req.session.userId = user.id;

      return user;
    },
  },
};
