import { Post } from "../../entities/Post";
import { GraphqlCustomErrorCode, GraphqlMyContext } from "../../types";
import { GraphQLError } from "graphql";

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
      args: { title: string },
      contextValue: GraphqlMyContext
    ): Promise<Post> => {
      return contextValue.em.save(Post, { title: args.title });
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
