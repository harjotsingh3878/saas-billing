import { UsageRepository, ReportUsageInput } from './repository';
import { createEvent, EventPublisher } from '@saas-billing/events';
import { UsageReportedEvent, UsageExceededEvent } from '@saas-billing/shared-types';

interface Context {
  userId: string;
  tenantId: string;
  repository: UsageRepository;
  eventPublisher: EventPublisher;
}

// Default limits (should come from subscription service in production)
const DEFAULT_LIMITS: Record<string, number> = {
  apiCalls: 1000,
  storage: 10,
  users: 5,
};

export const resolvers = {
  Query: {
    usage: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.repository.findById(id);
    },

    usageByTenant: async (
      _: any,
      { tenantId, period }: { tenantId: string; period?: string },
      context: Context
    ) => {
      return await context.repository.findByTenant(tenantId, period);
    },

    currentUsage: async (_: any, { tenantId }: { tenantId: string }, context: Context) => {
      return await context.repository.findByTenant(tenantId);
    },
  },

  Mutation: {
    reportUsage: async (_: any, { input }: { input: ReportUsageInput }, context: Context) => {
      const limit = DEFAULT_LIMITS[input.feature] || 1000;
      const usage = await context.repository.report(input, limit);

      // Publish usage.reported event
      const reportEvent = createEvent<UsageReportedEvent>(
        'usage.reported',
        {
          tenantId: usage.tenantId,
          feature: usage.feature,
          count: usage.count,
          timestamp: new Date(),
        },
        'usage-service'
      );

      await context.eventPublisher.publish(reportEvent);

      // Check if limit exceeded
      if (usage.count > usage.limit) {
        const exceededEvent = createEvent<UsageExceededEvent>(
          'usage.exceeded',
          {
            tenantId: usage.tenantId,
            feature: usage.feature,
            current: usage.count,
            limit: usage.limit,
          },
          'usage-service'
        );

        await context.eventPublisher.publish(exceededEvent);
      }

      return usage;
    },
  },

  Usage: {
    __resolveReference: async (reference: { id: string }, context: Context) => {
      return await context.repository.findById(reference.id);
    },
  },
};
