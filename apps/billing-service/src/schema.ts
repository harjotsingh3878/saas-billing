import gql from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

  type Tenant @key(fields: "id") {
    id: ID! @external
    invoices: [Invoice!]!
  }

  type Invoice @key(fields: "id") {
    id: ID!
    tenantId: ID!
    subscriptionId: ID!
    amount: Float!
    currency: String!
    status: InvoiceStatus!
    dueDate: String!
    paidAt: String
    pdfUrl: String
    lineItems: [LineItem!]!
    createdAt: String!
  }

  type LineItem {
    description: String!
    quantity: Int!
    unitPrice: Float!
    amount: Float!
  }

  enum InvoiceStatus {
    DRAFT
    OPEN
    PAID
    VOID
    UNCOLLECTIBLE
  }

  input GenerateInvoiceInput {
    tenantId: ID!
    subscriptionId: ID!
    lineItems: [LineItemInput!]!
  }

  input LineItemInput {
    description: String!
    quantity: Int!
    unitPrice: Float!
  }

  type Query {
    invoice(id: ID!): Invoice
    invoicesByTenant(tenantId: ID!): [Invoice!]!
  }

  type Mutation {
    generateInvoice(input: GenerateInvoiceInput!): Invoice!
    markInvoicePaid(id: ID!): Invoice!
  }
`;
