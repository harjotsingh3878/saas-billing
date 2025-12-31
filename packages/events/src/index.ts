import { DomainEvent } from '@saas-billing/shared-types';
import { v4 as uuidv4 } from 'uuid';

export * from './types';
export * from './kafka';
export * from './eventbridge';

export function createEvent<T extends DomainEvent>(
  eventType: T['eventType'],
  data: T['data'],
  source: string
): T {
  return {
    eventId: uuidv4(),
    eventType,
    timestamp: new Date(),
    source,
    version: '1.0',
    data,
  } as T;
}

// Idempotency helper
const processedEvents = new Set<string>();

export function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

export function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);

  // Clean up old events (keep last 10000)
  if (processedEvents.size > 10000) {
    const toDelete = Array.from(processedEvents).slice(0, 1000);
    toDelete.forEach((id) => processedEvents.delete(id));
  }
}

// For production, use Redis or DynamoDB for distributed idempotency
export async function withIdempotency<T>(
  eventId: string,
  handler: () => Promise<T>
): Promise<T | null> {
  if (isEventProcessed(eventId)) {
    console.log(`Event ${eventId} already processed, skipping`);
    return null;
  }

  const result = await handler();
  markEventProcessed(eventId);
  return result;
}
