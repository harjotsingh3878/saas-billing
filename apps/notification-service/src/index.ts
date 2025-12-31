import dotenv from 'dotenv';
import { createKafkaEventBus } from '@saas-billing/events';
import {
  DomainEvent,
  InvoiceGeneratedEvent,
  PaymentFailedEvent,
  UsageExceededEvent,
} from '@saas-billing/shared-types';
import { EmailService } from './email';
import { withIdempotency } from '@saas-billing/events';

dotenv.config();

const USE_KAFKA = process.env.USE_KAFKA === 'true';
const emailService = new EmailService();

// Mock tenant email lookup (in production, fetch from tenant service or database)
const getTenantEmail = async (tenantId: string): Promise<string> => {
  // TODO: Implement actual tenant lookup
  return `admin@tenant-${tenantId}.com`;
};

async function handleInvoiceGenerated(event: InvoiceGeneratedEvent): Promise<void> {
  await withIdempotency(event.eventId, async () => {
    console.log('Processing invoice.generated event:', event.data);

    const email = await getTenantEmail(event.data.tenantId);

    await emailService.sendInvoiceNotification(
      email,
      event.data.invoiceId,
      event.data.amount,
      event.data.dueDate
    );
  });
}

async function handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
  await withIdempotency(event.eventId, async () => {
    console.log('Processing payment.failed event:', event.data);

    const email = await getTenantEmail(event.data.tenantId);

    await emailService.sendPaymentFailedNotification(
      email,
      event.data.invoiceId,
      event.data.amount,
      event.data.reason
    );
  });
}

async function handleUsageExceeded(event: UsageExceededEvent): Promise<void> {
  await withIdempotency(event.eventId, async () => {
    console.log('Processing usage.exceeded event:', event.data);

    const email = await getTenantEmail(event.data.tenantId);

    await emailService.sendUsageExceededNotification(
      email,
      event.data.feature,
      event.data.current,
      event.data.limit
    );
  });
}

async function startConsumer() {
  if (!USE_KAFKA) {
    console.log('⚠️  Notification Service requires Kafka for event consumption');
    console.log('Set USE_KAFKA=true in your environment');
    return;
  }

  const eventBus = createKafkaEventBus(
    process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    'notification-service'
  );

  const consumer = eventBus.createConsumer('notification-service-group');

  // Subscribe to events
  await consumer.subscribe(
    ['invoice.generated', 'payment.failed', 'usage.exceeded'],
    async (event: DomainEvent) => {
      try {
        switch (event.eventType) {
          case 'invoice.generated':
            await handleInvoiceGenerated(event as InvoiceGeneratedEvent);
            break;
          case 'payment.failed':
            await handlePaymentFailed(event as PaymentFailedEvent);
            break;
          case 'usage.exceeded':
            await handleUsageExceeded(event as UsageExceededEvent);
            break;
          default:
            console.log(`Unhandled event type: ${event.eventType}`);
        }
      } catch (error) {
        console.error(`Error handling event ${event.eventType}:`, error);
        // In production, send to DLQ
      }
    }
  );

  await consumer.start();

  console.log('📧 Notification Service started and listening for events');
  console.log('   - invoice.generated');
  console.log('   - payment.failed');
  console.log('   - usage.exceeded');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down notification service...');
    await consumer.stop();
    process.exit(0);
  });
}

startConsumer().catch((error) => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});
