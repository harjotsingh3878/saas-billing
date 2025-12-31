import { Plan, PlanType, BillingPeriod } from '@saas-billing/shared-types';

export const PLANS: Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    type: PlanType.FREE,
    price: 0,
    billingPeriod: BillingPeriod.MONTHLY,
    features: [
      { name: 'Basic API Access', description: '100 API calls per month', included: true },
      { name: 'Storage', description: '1 GB storage', included: true },
      { name: 'Support', description: 'Community support', included: true },
    ],
    limits: {
      apiCalls: 100,
      storage: 1,
      users: 1,
    },
  },
  {
    id: 'plan_basic',
    name: 'Basic',
    type: PlanType.BASIC,
    price: 29,
    billingPeriod: BillingPeriod.MONTHLY,
    features: [
      { name: 'API Access', description: '10,000 API calls per month', included: true },
      { name: 'Storage', description: '10 GB storage', included: true },
      { name: 'Support', description: 'Email support', included: true },
      { name: 'Analytics', description: 'Basic analytics', included: true },
    ],
    limits: {
      apiCalls: 10000,
      storage: 10,
      users: 5,
    },
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    type: PlanType.PRO,
    price: 99,
    billingPeriod: BillingPeriod.MONTHLY,
    features: [
      { name: 'API Access', description: '100,000 API calls per month', included: true },
      { name: 'Storage', description: '100 GB storage', included: true },
      { name: 'Support', description: 'Priority support', included: true },
      { name: 'Analytics', description: 'Advanced analytics', included: true },
      { name: 'Custom integrations', description: 'Webhooks & API', included: true },
    ],
    limits: {
      apiCalls: 100000,
      storage: 100,
      users: 25,
    },
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    type: PlanType.ENTERPRISE,
    price: 499,
    billingPeriod: BillingPeriod.MONTHLY,
    features: [
      { name: 'API Access', description: 'Unlimited API calls', included: true },
      { name: 'Storage', description: 'Unlimited storage', included: true },
      { name: 'Support', description: '24/7 dedicated support', included: true },
      { name: 'Analytics', description: 'Custom analytics', included: true },
      { name: 'Custom integrations', description: 'Full API access', included: true },
      { name: 'SLA', description: '99.99% uptime guarantee', included: true },
    ],
    limits: {
      apiCalls: -1, // unlimited
      storage: -1, // unlimited
      users: -1, // unlimited
    },
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export function getAllPlans(): Plan[] {
  return PLANS;
}
