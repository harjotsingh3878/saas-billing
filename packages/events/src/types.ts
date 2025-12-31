import { DomainEvent } from '@saas-billing/shared-types';

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

export interface EventConsumer {
  subscribe(eventTypes: string[], handler: EventHandler): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface EventBusConfig {
  type: 'kafka' | 'eventbridge';
  kafka?: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };
  eventbridge?: {
    eventBusName: string;
    region: string;
  };
}
