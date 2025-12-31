import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl font-bold mb-6">SaaS Billing Platform</h1>
        <p className="text-xl mb-8 text-gray-600">
          Multi-Tenant Subscription Billing with GraphQL Federation
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/pricing"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            View Pricing
          </Link>
          <Link
            href="/login"
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">GraphQL Federation</h3>
            <p className="text-gray-600">Microservices with unified API</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Event-Driven</h3>
            <p className="text-gray-600">Kafka & AWS EventBridge</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Serverless</h3>
            <p className="text-gray-600">AWS Lambda & DynamoDB</p>
          </div>
        </div>
      </div>
    </main>
  );
}
