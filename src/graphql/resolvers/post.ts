import { validate } from "class-validator";
import { PostInput } from "../../entities/DTO/PostInput";
import { Post } from "../../entities/Post";
import { GraphqlCustomErrorCode, GraphqlMyContext } from "../../types";
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";
import { plainToClass } from "class-transformer";
import { getValidatorErrors } from "../../utils";

export const postResolvers = {
  Query: {
    getPosts: async (
      _: unknown,
      args: { id: number },
      contextValue: GraphqlMyContext
    ): Promise<Post[]> => {
      return contextValue.em.find(Post, {});
    },

    getPost: async (
      _: unknown,
      args: { id: number },
      contextValue: GraphqlMyContext
    ): Promise<Post | null> => {
      return contextValue.em.findOne(Post, { where: { id: args.id } });
    },
  },

  Mutation: {
    createPost: async (
      _: unknown,
      args: { postInput: PostInput },
      contextValue: GraphqlMyContext
    ): Promise<Post> => {
      const { postInput } = args;
      const errors = await validate(plainToClass(PostInput, postInput));

      if (errors.length > 0) {
        throw new GraphQLError("Invalid input", {
          extensions: {
            code: ApolloServerErrorCode.BAD_USER_INPUT,
            validations: getValidatorErrors(errors),
          },
        });
      }

      return contextValue.em.save(Post, {
        ...postInput,
        authorId: contextValue.req.session.userId,
      });
    },
    updatePost: async (
      _: unknown,
      args: { id: number; title: string },
      contextValue: GraphqlMyContext
    ): Promise<Post> => {
      const post = await contextValue.em.findOne(Post, {
        where: { id: args.id },
      });

      if (!post) {
        throw new GraphQLError("Post not found", {
          extensions: {
            id: args.id,
            code: GraphqlCustomErrorCode.NOT_FOUND,
          },
        });
      }

      post.title = args.title;
      return contextValue.em.save(Post, post);
    },
    deletePost: async (
      _: unknown,
      args: { id: number; title: string },
      contextValue: GraphqlMyContext
    ): Promise<boolean> => {
      const post = await contextValue.em.findOne(Post, {
        where: { id: args.id },
      });

      if (!post) {
        throw new GraphQLError("Post not found", {
          extensions: {
            id: args.id,
            code: GraphqlCustomErrorCode.NOT_FOUND,
          },
        });
      }

      await contextValue.em.remove(post);

      return true;
    },
  },
};
