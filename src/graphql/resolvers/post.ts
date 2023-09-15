import { EntityNotFoundError } from "typeorm";
import { Post } from "../../entities/Post";
import { GraphqlMyContext } from "../../types";

export const postResolvers = {
  Query: {
    getPosts: (
      _: unknown,
      args: { id: number },
      contextValue: GraphqlMyContext
    ): Promise<Post[]> => {
      return contextValue.em.find(Post, {});
    },

    getPost: (
      _: unknown,
      args: { id: number },
      contextValue: GraphqlMyContext
    ): Promise<Post | null> => {
      return contextValue.em.findOne(Post, { where: { id: args.id } });
    },
  },

  Mutation: {
    createPost: (
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

      if (!post) throw new EntityNotFoundError(Post, args.id);

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

      if (!post) throw new EntityNotFoundError(Post, args.id);

      await contextValue.em.remove(post);

      return true;
    },
  },
};
