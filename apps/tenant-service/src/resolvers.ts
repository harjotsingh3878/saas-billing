import { TenantRepository, CreateTenantInput, UpdateTenantInput } from './repository';
import { createEvent, EventPublisher } from '@saas-billing/events';
import { TenantCreatedEvent, TenantUpdatedEvent, Tenant } from '@saas-billing/shared-types';

interface Context {
  userId: string;
  tenantId: string;
  userRole: string;
  repository: TenantRepository;
  eventPublisher: EventPublisher;
}

export const resolvers = {
  Query: {
    tenant: async (_: any, { id }: { id: string }, context: Context) => {
      return await context.repository.findById(id);
    },

    myTenants: async (_: any, __: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }
      return await context.repository.findByOwnerId(context.userId);
    },
  },

  Mutation: {
    createTenant: async (_: any, { input }: { input: CreateTenantInput }, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      const tenant = await context.repository.create({
        ...input,
        ownerId: context.userId,
      });

      // Publish event
      const event = createEvent<TenantCreatedEvent>(
        'tenant.created',
        {
          tenantId: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
        },
        'tenant-service'
      );

      await context.eventPublisher.publish(event);

      return tenant;
    },

    updateTenant: async (
      _: any,
      { id, input }: { id: string; input: UpdateTenantInput },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      // Check tenant ownership or admin role
      const existingTenant = await context.repository.findById(id);
      if (!existingTenant) {
        throw new Error('Tenant not found');
      }

      if (context.tenantId !== id && context.userRole !== 'ADMIN') {
        throw new Error('Forbidden: You do not have permission to update this tenant');
      }

      const updatedTenant = await context.repository.update(id, input);

      // Publish event
      const event = createEvent<TenantUpdatedEvent>(
        'tenant.updated',
        {
          tenantId: updatedTenant.id,
          changes: input,
        },
        'tenant-service'
      );

      await context.eventPublisher.publish(event);

      return updatedTenant;
    },

    deleteTenant: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      if (context.tenantId !== id && context.userRole !== 'ADMIN') {
        throw new Error('Forbidden: You do not have permission to delete this tenant');
      }

      await context.repository.delete(id);
      return true;
    },
  },

  Tenant: {
    __resolveReference: async (reference: { id: string }, context: Context) => {
      return await context.repository.findById(reference.id);
    },
  },
};
