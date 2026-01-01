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

export const GET_MY_TENANTS = gql`
  query GetMyTenants {
    myTenants {
      id
      name
      plan
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_SUBSCRIPTION = gql`
  query GetSubscription($id: ID!) {
    subscription(id: $id) {
      id
      tenantId
      planId
      status
      currentPeriodStart
      currentPeriodEnd
      trialEnd
      seats
      cancelAtPeriodEnd
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
      planId
      status
      currentPeriodStart
      currentPeriodEnd
      trialEnd
      seats
      cancelAtPeriodEnd
      createdAt
      updatedAt
    }
  }
`;

export const GET_USAGE = gql`
  query GetUsage($tenantId: ID!, $period: String) {
    usageByTenant(tenantId: $tenantId, period: $period) {
      id
      tenantId
      feature
      count
      limit
      period
      createdAt
      updatedAt
    }
  }
`;

export const GET_CURRENT_USAGE = gql`
  query GetCurrentUsage($tenantId: ID!) {
    currentUsage(tenantId: $tenantId) {
      id
      tenantId
      feature
      count
      limit
      period
      createdAt
      updatedAt
    }
  }
`;

export const GET_INVOICES = gql`
  query GetInvoices($tenantId: ID!) {
    invoicesByTenant(tenantId: $tenantId) {
      id
      tenantId
      subscriptionId
      amount
      currency
      status
      dueDate
      paidAt
      pdfUrl
      createdAt
    }
  }
`;
