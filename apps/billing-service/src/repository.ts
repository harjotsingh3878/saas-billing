import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Invoice, InvoiceStatus, LineItem } from '@saas-billing/shared-types';
import { v4 as uuidv4 } from 'uuid';
import { addMonths } from 'date-fns';
import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';
import path from 'path';

// Load .env before creating clients
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && { 
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.INVOICES_TABLE || 'Invoices';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.S3_ENDPOINT && { 
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
    forcePathStyle: true,
  }),
});

const BUCKET_NAME = process.env.S3_INVOICES_BUCKET || 'saas-invoices';

export interface GenerateInvoiceInput {
  tenantId: string;
  subscriptionId: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export class BillingRepository {
  async generate(input: GenerateInvoiceInput): Promise<Invoice> {
    const lineItems: LineItem[] = input.lineItems.map((item) => ({
      ...item,
      amount: item.quantity * item.unitPrice,
    }));

    const amount = lineItems.reduce((sum, item) => sum + item.amount, 0);

    const invoice: Invoice = {
      id: uuidv4(),
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      amount,
      currency: 'USD',
      status: InvoiceStatus.OPEN,
      dueDate: addMonths(new Date(), 1),
      lineItems,
      createdAt: new Date(),
    };

    // Generate PDF and upload to S3
    const pdfUrl = await this.generatePDF(invoice);
    invoice.pdfUrl = pdfUrl;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...invoice,
          dueDate: invoice.dueDate.toISOString(),
          createdAt: invoice.createdAt.toISOString(),
          paidAt: invoice.paidAt?.toISOString(),
        },
      })
    );

    return invoice;
  }

  async findById(id: string): Promise<Invoice | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    if (!result.Item) return null;
    return this.mapToInvoice(result.Item);
  }

  async findByTenant(tenantId: string): Promise<Invoice[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'TenantIdIndex',
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId,
        },
      })
    );

    return (result.Items || []).map(this.mapToInvoice);
  }

  async markPaid(id: string): Promise<Invoice> {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET #status = :status, paidAt = :paidAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': InvoiceStatus.PAID,
          ':paidAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return this.mapToInvoice(result.Attributes!);
  }

  private async generatePDF(invoice: Invoice): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const key = `invoices/${invoice.tenantId}/${invoice.id}.pdf`;

        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: key,
              Body: pdfBuffer,
              ContentType: 'application/pdf',
            })
          );

          resolve(`https://${BUCKET_NAME}.s3.amazonaws.com/${key}`);
        } catch (error) {
          reject(error);
        }
      });

      // Build PDF
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice #: ${invoice.id}`);
      doc.text(`Date: ${invoice.createdAt.toLocaleDateString()}`);
      doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
      doc.moveDown();

      doc.text('Line Items:', { underline: true });
      invoice.lineItems.forEach((item) => {
        doc.text(
          `${item.description}: ${item.quantity} x $${item.unitPrice} = $${item.amount}`
        );
      });

      doc.moveDown();
      doc.fontSize(14).text(`Total: $${invoice.amount}`, { bold: true });

      doc.end();
    });
  }

  private mapToInvoice(item: any): Invoice {
    return {
      id: item.id,
      tenantId: item.tenantId,
      subscriptionId: item.subscriptionId,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      dueDate: new Date(item.dueDate),
      paidAt: item.paidAt ? new Date(item.paidAt) : undefined,
      pdfUrl: item.pdfUrl,
      lineItems: item.lineItems,
      createdAt: new Date(item.createdAt),
    };
  }
}
