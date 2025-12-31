import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'billing@yourdomain.com';

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export class EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const command = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: options.htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: options.textBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await sesClient.send(command);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendInvoiceNotification(
    email: string,
    invoiceId: string,
    amount: number,
    dueDate: Date
  ): Promise<void> {
    const subject = `Invoice ${invoiceId} - $${amount} Due`;

    const htmlBody = `
      <html>
        <body>
          <h2>New Invoice Generated</h2>
          <p>An invoice has been generated for your account.</p>
          <ul>
            <li><strong>Invoice ID:</strong> ${invoiceId}</li>
            <li><strong>Amount:</strong> $${amount}</li>
            <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
          </ul>
          <p>Please visit your dashboard to view and pay this invoice.</p>
          <p>Thank you for your business!</p>
        </body>
      </html>
    `;

    const textBody = `
      New Invoice Generated
      
      An invoice has been generated for your account.
      
      Invoice ID: ${invoiceId}
      Amount: $${amount}
      Due Date: ${dueDate.toLocaleDateString()}
      
      Please visit your dashboard to view and pay this invoice.
      
      Thank you for your business!
    `;

    await this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendPaymentFailedNotification(
    email: string,
    invoiceId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    const subject = `Payment Failed for Invoice ${invoiceId}`;

    const htmlBody = `
      <html>
        <body>
          <h2>Payment Failed</h2>
          <p>We were unable to process your payment.</p>
          <ul>
            <li><strong>Invoice ID:</strong> ${invoiceId}</li>
            <li><strong>Amount:</strong> $${amount}</li>
            <li><strong>Reason:</strong> ${reason}</li>
          </ul>
          <p>Please update your payment method and try again.</p>
          <p>If you have any questions, please contact our support team.</p>
        </body>
      </html>
    `;

    const textBody = `
      Payment Failed
      
      We were unable to process your payment.
      
      Invoice ID: ${invoiceId}
      Amount: $${amount}
      Reason: ${reason}
      
      Please update your payment method and try again.
      
      If you have any questions, please contact our support team.
    `;

    await this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendUsageExceededNotification(
    email: string,
    feature: string,
    current: number,
    limit: number
  ): Promise<void> {
    const subject = `Usage Limit Exceeded: ${feature}`;

    const htmlBody = `
      <html>
        <body>
          <h2>Usage Limit Exceeded</h2>
          <p>Your account has exceeded the usage limit for ${feature}.</p>
          <ul>
            <li><strong>Feature:</strong> ${feature}</li>
            <li><strong>Current Usage:</strong> ${current}</li>
            <li><strong>Limit:</strong> ${limit}</li>
          </ul>
          <p>Please upgrade your plan to continue using this feature.</p>
        </body>
      </html>
    `;

    const textBody = `
      Usage Limit Exceeded
      
      Your account has exceeded the usage limit for ${feature}.
      
      Feature: ${feature}
      Current Usage: ${current}
      Limit: ${limit}
      
      Please upgrade your plan to continue using this feature.
    `;

    await this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }
}
