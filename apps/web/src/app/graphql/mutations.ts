import { gql } from '@apollo/client';

export const CREATE_TENANT = gql`
  mutation CreateTenant($name: String!, $plan: String!) {
    createTenant(name: $name, plan: $plan) {
      id
      name
      plan
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TENANT = gql`
  mutation UpdateTenant($id: ID!, $name: String, $plan: String, $status: String) {
    updateTenant(id: $id, name: $name, plan: $plan, status: $status) {
      id
      name
      plan
      status
      updatedAt
    }
  }
`;

export const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($tenantId: ID!, $planId: ID!, $seats: Int) {
    createSubscription(tenantId: $tenantId, planId: $planId, seats: $seats) {
      id
      tenantId
      planId
      status
      currentPeriodStart
      currentPeriodEnd
      seats
      createdAt
    }
  }
`;

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($id: ID!) {
    cancelSubscription(id: $id) {
      id
      status
      cancelAtPeriodEnd
      updatedAt
    }
  }
`;

export const REPORT_USAGE = gql`
  mutation ReportUsage($tenantId: ID!, $feature: String!, $count: Int!) {
    reportUsage(tenantId: $tenantId, feature: $feature, count: $count) {
      id
      tenantId
      feature
      count
      limit
      period
      createdAt
    }
  }
`;

export const GENERATE_INVOICE = gql`
  mutation GenerateInvoice($tenantId: ID!, $subscriptionId: ID!) {
    generateInvoice(tenantId: $tenantId, subscriptionId: $subscriptionId) {
      id
      tenantId
      subscriptionId
      amount
      currency
      status
      dueDate
      createdAt
    }
  }
`;
