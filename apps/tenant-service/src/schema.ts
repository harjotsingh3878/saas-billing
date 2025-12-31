import gql from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type Tenant @key(fields: "id") {
    id: ID!
    name: String!
    plan: PlanType!
    status: TenantStatus!
    createdAt: String!
    updatedAt: String!
  }

  enum PlanType {
    FREE
    BASIC
    PRO
    ENTERPRISE
  }

  enum TenantStatus {
    ACTIVE
    SUSPENDED
    DELETED
  }

  input CreateTenantInput {
    name: String!
    plan: PlanType!
  }

  input UpdateTenantInput {
    name: String
    plan: PlanType
    status: TenantStatus
  }

  type Query {
    tenant(id: ID!): Tenant
    myTenants: [Tenant!]!
  }

  type Mutation {
    createTenant(input: CreateTenantInput!): Tenant!
    updateTenant(id: ID!, input: UpdateTenantInput!): Tenant!
    deleteTenant(id: ID!): Boolean!
  }
`;
