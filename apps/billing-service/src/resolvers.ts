import { BillingRepository, GenerateInvoiceInput } from './repository';
import { createEvent, EventPublisher } from '@saas-billing/events';
import { InvoiceGeneratedEvent } from '@saas-billing/shared-types';

interface Context {
  userId: string;
  tenantId: string;
  repository: BillingRepository;
  eventPublisher: EventPublisher;
}

export const resolvers = {
  Query: {
    invoice: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.repository.findById(id);
    },

    invoicesByTenant: async (_: any, { tenantId }: { tenantId: string }, context: Context) => {
      return await context.repository.findByTenant(tenantId);
    },
  },

  Mutation: {
    generateInvoice: async (
      _: any,
      { input }: { input: GenerateInvoiceInput },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      const invoice = await context.repository.generate(input);

      // Publish event
      const event = createEvent<InvoiceGeneratedEvent>(
        'invoice.generated',
        {
          invoiceId: invoice.id,
          tenantId: invoice.tenantId,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
        },
        'billing-service'
      );

      await context.eventPublisher.publish(event);

      return invoice;
    },

    markInvoicePaid: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      return await context.repository.markPaid(id);
    },
  },

  Invoice: {
    __resolveReference: async (reference: { id: string }, context: Context) => {
      return await context.repository.findById(reference.id);
    },
  },

  Tenant: {
    invoices: async (tenant: { id: string }, _: any, context: Context) => {
      return await context.repository.findByTenant(tenant.id);
    },
  },
};
