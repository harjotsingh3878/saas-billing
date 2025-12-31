import './globals.css';
import { ApolloWrapper } from './providers/ApolloWrapper';

export const metadata = {
  title: 'SaaS Billing Platform',
  description: 'Multi-Tenant Subscription Billing Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
