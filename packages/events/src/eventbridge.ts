import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsRequestEntry,
} from '@aws-sdk/client-eventbridge';
import { DomainEvent } from '@saas-billing/shared-types';
import { EventPublisher } from './types';

export class EventBridgePublisher implements EventPublisher {
  private client: EventBridgeClient;

  constructor(
    private eventBusName: string,
    private region: string = 'us-east-1',
    private source: string = 'saas-billing'
  ) {
    this.client = new EventBridgeClient({ region: this.region });
  }

  async publish(event: DomainEvent): Promise<void> {
    const entry: PutEventsRequestEntry = {
      Source: this.source,
      DetailType: event.eventType,
      Detail: JSON.stringify(event),
      EventBusName: this.eventBusName,
    };

    const command = new PutEventsCommand({
      Entries: [entry],
    });

    const response = await this.client.send(command);

    if (response.FailedEntryCount && response.FailedEntryCount > 0) {
      throw new Error(`Failed to publish event: ${JSON.stringify(response.Entries)}`);
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    const entries: PutEventsRequestEntry[] = events.map((event) => ({
      Source: this.source,
      DetailType: event.eventType,
      Detail: JSON.stringify(event),
      EventBusName: this.eventBusName,
    }));

    // EventBridge has a limit of 10 entries per request
    const chunks: PutEventsRequestEntry[][] = [];
    for (let i = 0; i < entries.length; i += 10) {
      chunks.push(entries.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const command = new PutEventsCommand({
        Entries: chunk,
      });

      const response = await this.client.send(command);

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        throw new Error(`Failed to publish batch: ${JSON.stringify(response.Entries)}`);
      }
    }
  }
}

export function createEventBridgePublisher(
  eventBusName: string,
  region?: string,
  source?: string
): EventBridgePublisher {
  return new EventBridgePublisher(eventBusName, region, source);
}
