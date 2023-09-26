export const userTypeDef = `#graphql
    input CreateUserInput {
        username: String!
        password: String!
    }

    type User {
        id: Int!
        createdAt: String
        updatedAt: String
        username: String!
    }

    type Mutation {
        register(userInput: CreateUserInput!): User
        login(userInput: CreateUserInput!): User
    }

    type Query {
        getUser: User
    }
`;
