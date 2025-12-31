import gql from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external"])

  type Tenant @key(fields: "id") {
    id: ID! @external
    subscription: Subscription
  }

  type Subscription @key(fields: "id") {
    id: ID!
    tenantId: ID!
    plan: Plan!
    status: SubscriptionStatus!
    currentPeriodStart: String!
    currentPeriodEnd: String!
    trialEnd: String
    seats: Int!
    cancelAtPeriodEnd: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Plan {
    id: ID!
    name: String!
    type: PlanType!
    price: Float!
    billingPeriod: BillingPeriod!
    features: [PlanFeature!]!
    limits: UsageLimits!
  }

  type PlanFeature {
    name: String!
    description: String!
    included: Boolean!
  }

  type UsageLimits {
    apiCalls: Int!
    storage: Int!
    users: Int!
  }

  enum PlanType {
    FREE
    BASIC
    PRO
    ENTERPRISE
  }

  enum SubscriptionStatus {
    ACTIVE
    TRIAL
    PAST_DUE
    CANCELED
    INCOMPLETE
  }

  enum BillingPeriod {
    MONTHLY
    YEARLY
  }

  input CreateSubscriptionInput {
    tenantId: ID!
    planId: ID!
    seats: Int!
  }

  input UpdateSubscriptionInput {
    planId: ID
    seats: Int
    cancelAtPeriodEnd: Boolean
  }

  type Query {
    subscription(id: ID!): Subscription
    subscriptionByTenant(tenantId: ID!): Subscription
    plans: [Plan!]!
    plan(id: ID!): Plan
  }

  type Mutation {
    createSubscription(input: CreateSubscriptionInput!): Subscription!
    updateSubscription(id: ID!, input: UpdateSubscriptionInput!): Subscription!
    cancelSubscription(id: ID!): Subscription!
  }
`;
