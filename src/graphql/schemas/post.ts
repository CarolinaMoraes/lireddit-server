export const postTypeDef = `#graphql
type Post {
  id: Int!
  title: String!
  updatedAt: String
  createdAt: String
}

type Query {
  getPosts: [Post]
  getPost(id: Int!): Post
}

type Mutation {
  createPost(title: String!): Post
  updatePost(id: Int!, title: String!): Post
  deletePost(id: Int!): Boolean
}
`;
