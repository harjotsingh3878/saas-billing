import { gql } from '@apollo/client';

export const GET_PLANS = gql`
  query GetPlans {
    plans {
      id
      name
      type
      price
      billingPeriod
      features {
        name
        description
        included
      }
      limits {
        apiCalls
        storage
        users
      }
    }
  }
`;

export const GET_INVOICES = gql`
  query GetInvoicesByTenant($tenantId: ID!) {
    invoicesByTenant(tenantId: $tenantId) {
      id
      amount
      currency
      status
      dueDate
      paidAt
      pdfUrl
      createdAt
      lineItems {
        description
        quantity
        unitPrice
        amount
      }
    }
  }
`;

export const GET_SUBSCRIPTION = gql`
  query GetSubscription($id: ID!) {
    subscription(id: $id) {
      id
      tenantId
      plan {
        id
        name
        type
        price
      }
      status
      currentPeriodStart
      currentPeriodEnd
      cancelAtPeriodEnd
      trialEnd
      createdAt
      updatedAt
    }
  }
`;

export const GET_SUBSCRIPTION_BY_TENANT = gql`
  query GetSubscriptionByTenant($tenantId: ID!) {
    subscriptionByTenant(tenantId: $tenantId) {
      id
      tenantId
      plan {
        id
        name
        type
        price
      }
      status
      currentPeriodStart
      currentPeriodEnd
      cancelAtPeriodEnd
      trialEnd
      createdAt
      updatedAt
    }
  }
`;

export const GET_TENANT = gql`
  query GetTenant($id: ID!) {
    tenant(id: $id) {
      id
      name
      plan
      status
      createdAt
      updatedAt
    }
  }
`;
