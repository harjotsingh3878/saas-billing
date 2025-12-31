import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { DomainEvent } from '@saas-billing/shared-types';
import { EventPublisher, EventConsumer, EventHandler } from './types';
import { v4 as uuidv4 } from 'uuid';

export class KafkaEventPublisher implements EventPublisher {
  private producer: Producer;
  private connected = false;

  constructor(private kafka: Kafka, private topic: string = 'saas-billing-events') {
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.connect();

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: event.eventType,
          value: JSON.stringify(event),
          headers: {
            eventId: event.eventId,
            eventType: event.eventType,
            timestamp: event.timestamp.toISOString(),
          },
        },
      ],
    });
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    await this.connect();

    await this.producer.send({
      topic: this.topic,
      messages: events.map((event) => ({
        key: event.eventType,
        value: JSON.stringify(event),
        headers: {
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp.toISOString(),
        },
      })),
    });
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
    }
  }
}

export class KafkaEventConsumer implements EventConsumer {
  private consumer: Consumer;
  private handlers: Map<string, EventHandler[]> = new Map();
  private running = false;

  constructor(
    private kafka: Kafka,
    private groupId: string,
    private topic: string = 'saas-billing-events'
  ) {
    this.consumer = this.kafka.consumer({ groupId: this.groupId });
  }

  async subscribe(eventTypes: string[], handler: EventHandler): Promise<void> {
    for (const eventType of eventTypes) {
      const existing = this.handlers.get(eventType) || [];
      existing.push(handler);
      this.handlers.set(eventType, existing);
    }
  }

  async start(): Promise<void> {
    if (this.running) return;

    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        await this.handleMessage(message);
      },
    });

    this.running = true;
  }

  private async handleMessage(message: any): Promise<void> {
    try {
      const event = JSON.parse(message.value.toString()) as DomainEvent;
      const handlers = this.handlers.get(event.eventType) || [];

      // Process handlers sequentially for idempotency
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Handler error for ${event.eventType}:`, error);
          // Consider implementing DLQ logic here
        }
      }
    } catch (error) {
      console.error('Failed to parse event:', error);
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    await this.consumer.disconnect();
    this.running = false;
  }
}

export function createKafkaEventBus(brokers: string[], clientId: string) {
  const kafka = new Kafka({
    clientId,
    brokers,
  });

  return {
    createPublisher: (topic?: string) => new KafkaEventPublisher(kafka, topic),
    createConsumer: (groupId: string, topic?: string) =>
      new KafkaEventConsumer(kafka, groupId, topic),
  };
}
