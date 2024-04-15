export const userTypeDef = `#graphql
    input CreateUserInput {
        username: String!
        password: String!
        email: String!
    }

    input LoginUserInput {
        usernameOrEmail: String!
        password: String!
    }

    type User {
        id: Int!
        createdAt: String
        updatedAt: String
        username: String! 
        email: String!
    }

    type Mutation {
        register(userInput: CreateUserInput!): User
        login(userInput: LoginUserInput!): User
        logout: Boolean
        forgotPassword(email: String!): Boolean
        changePassword(token: String!, newPassword: String!): User
    }

    type Query {
        getUser: User
        me: User
    }
`;
