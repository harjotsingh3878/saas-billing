import { SubscriptionRepository, CreateSubscriptionInput } from './repository';
import { getAllPlans, getPlanById } from './plans';
import { createEvent, EventPublisher } from '@saas-billing/events';
import { SubscriptionCreatedEvent, SubscriptionCanceledEvent, SubscriptionStatus } from '@saas-billing/shared-types';

interface Context {
  userId: string;
  tenantId: string;
  repository: SubscriptionRepository;
  eventPublisher: EventPublisher;
}

export const resolvers = {
  Query: {
    subscription: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.repository.findById(id);
    },

    subscriptionByTenant: async (_: any, { tenantId }: { tenantId: string }, context: Context) => {
      return await context.repository.findByTenantId(tenantId);
    },

    plans: () => getAllPlans(),

    plan: (_: any, { id }: { id: string }) => getPlanById(id),
  },

  Mutation: {
    createSubscription: async (_: any, { input }: { input: CreateSubscriptionInput }, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      const subscription = await context.repository.create(input);

      const event = createEvent<SubscriptionCreatedEvent>(
        'subscription.created',
        {
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          planId: subscription.planId,
          status: subscription.status,
        },
        'subscription-service'
      );

      await context.eventPublisher.publish(event);

      return subscription;
    },

    updateSubscription: async (
      _: any,
      { id, input }: { id: string; input: Partial<CreateSubscriptionInput> },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      return await context.repository.update(id, input);
    },

    cancelSubscription: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      const subscription = await context.repository.update(id, {
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: true,
      });

      const event = createEvent<SubscriptionCanceledEvent>(
        'subscription.canceled',
        {
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          canceledAt: new Date(),
        },
        'subscription-service'
      );

      await context.eventPublisher.publish(event);

      return subscription;
    },
  },

  Subscription: {
    __resolveReference: async (reference: { id: string }, context: Context) => {
      return await context.repository.findById(reference.id);
    },

    plan: (subscription: any) => {
      return getPlanById(subscription.planId);
    },
  },

  Tenant: {
    subscription: async (tenant: { id: string }, _: any, context: Context) => {
      return await context.repository.findByTenantId(tenant.id);
    },
  },
};
