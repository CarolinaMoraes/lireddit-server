export const postTypeDef = `#graphql
type Post {
  id: Int!
  title: String!
  text: String!
  author: User
  updatedAt: String
  createdAt: String
}

type Query {
  getPosts: [Post]
  getPost(id: Int!): Post
}

type Mutation {
  createPost(postInput: PostInput): Post
  updatePost(id: Int!, title: String!): Post
  deletePost(id: Int!): Boolean
}

input PostInput {
  title: String!
  text: String!
}
`;
