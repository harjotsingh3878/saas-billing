import { gql } from '@apollo/client';

export const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id
      tenantId
      planId
      status
      currentPeriodStart
      currentPeriodEnd
      trialEnd
      createdAt
    }
  }
`;

export const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateSubscription($id: ID!, $input: UpdateSubscriptionInput!) {
    updateSubscription(id: $id, input: $input) {
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
      updatedAt
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

export const GENERATE_INVOICE = gql`
  mutation GenerateInvoice($input: GenerateInvoiceInput!) {
    generateInvoice(input: $input) {
      id
      tenantId
      subscriptionId
      amount
      currency
      status
      dueDate
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

export const MARK_INVOICE_PAID = gql`
  mutation MarkInvoicePaid($id: String!) {
    markInvoicePaid(id: $id) {
      id
      status
      paidAt
    }
  }
`;

export const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      id
      name
      plan
      status
      createdAt
    }
  }
`;

export const UPDATE_TENANT = gql`
  mutation UpdateTenant($id: String!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, input: $input) {
      id
      name
      plan
      status
      updatedAt
    }
  }
`;
