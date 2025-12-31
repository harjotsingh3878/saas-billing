import gql from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type Usage @key(fields: "id") {
    id: ID!
    tenantId: ID!
    feature: String!
    count: Int!
    limit: Int!
    period: String!
    createdAt: String!
    updatedAt: String!
  }

  input ReportUsageInput {
    tenantId: ID!
    feature: String!
    count: Int!
  }

  type Query {
    usage(id: ID!): Usage
    usageByTenant(tenantId: ID!, period: String): [Usage!]!
    currentUsage(tenantId: ID!): [Usage!]!
  }

  type Mutation {
    reportUsage(input: ReportUsageInput!): Usage!
  }
`;
