'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { GET_PLANS } from '../graphql/queries';

export default function PricingPage() {
  const { loading, error, data } = useQuery(GET_PLANS);

  if (loading) return <div className="p-8 text-center">Loading plans...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading plans</div>;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4">Pricing Plans</h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Choose the perfect plan for your needs
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {data.plans.map((plan: any) => (
            <div
              key={plan.id}
              className="border rounded-lg p-6 hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold mb-4">
                ${plan.price}
                <span className="text-lg text-gray-600">/{plan.billingPeriod.toLowerCase()}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature: any, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span className="text-sm">{feature.description}</span>
                  </li>
                ))}
              </ul>

              <div className="text-sm text-gray-600 mb-6">
                <div>API Calls: {plan.limits.apiCalls === -1 ? 'Unlimited' : plan.limits.apiCalls}</div>
                <div>Storage: {plan.limits.storage === -1 ? 'Unlimited' : `${plan.limits.storage} GB`}</div>
                <div>Users: {plan.limits.users === -1 ? 'Unlimited' : plan.limits.users}</div>
              </div>

              <Link 
                href={`/signup?plan=${plan.id}`}
                className="block w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-center"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
