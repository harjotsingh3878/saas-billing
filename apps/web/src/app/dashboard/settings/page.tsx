'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import Link from 'next/link';
import DashboardNav from '../../../components/DashboardNav';
import { GET_PLANS, GET_SUBSCRIPTION_BY_TENANT } from '../../../graphql/queries';
import { UPDATE_SUBSCRIPTION } from '../../../graphql/mutations';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const [changingPlan, setChangingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const tenantId = 'tenant_demo_123'; // TODO: Get from auth context
  
  const { loading, error, data } = useQuery(GET_PLANS);
  const { data: subscriptionData, refetch: refetchSubscription } = useQuery(GET_SUBSCRIPTION_BY_TENANT, {
    variables: { tenantId },
  });
  
  const [updateSubscription] = useMutation(UPDATE_SUBSCRIPTION);

  const currentPlan = subscriptionData?.subscriptionByTenant?.plan?.id || 'plan_pro';
  const subscriptionId = subscriptionData?.subscriptionByTenant?.id;

  const handlePlanChange = async (planId: string) => {
    if (!subscriptionId) {
      setNotification({ type: 'error', message: 'Subscription not found.' });
      return;
    }

    setSelectedPlan(planId);
    setChangingPlan(true);
    setNotification(null);

    try {
      await updateSubscription({
        variables: {
          id: subscriptionId,
          input: {
            planId,
          },
        },
      });
      
      await refetchSubscription();
      setNotification({ type: 'success', message: 'Plan updated successfully!' });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error('Plan update error:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to update plan. Please try again.' });
    } finally {
      setChangingPlan(false);
      setSelectedPlan(null);
    }
  };

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Settings</h1>

          {/* Notification Banner */}
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="text-current hover:opacity-70"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('plan')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'plan'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subscription Plan
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'account'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'team'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team
              </button>
            </nav>
          </div>

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Change Plan</h2>
              
              {loading && <p className="text-gray-600">Loading plans...</p>}
              {error && <p className="text-red-600">Error loading plans</p>}
              
              {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.plans.map((plan: any) => {
                    const isCurrent = plan.id === currentPlan;
                    return (
                      <div
                        key={plan.id}
                        className={`border rounded-lg p-6 ${
                          isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        {isCurrent && (
                          <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded mb-2">
                            Current Plan
                          </span>
                        )}
                        <h3 className="text-xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                        <div className="text-3xl font-bold mb-4 text-gray-900">
                          ${plan.price}
                          <span className="text-sm text-gray-600">/{plan.billingPeriod.toLowerCase()}</span>
                        </div>

                        <ul className="space-y-2 mb-6">
                          {plan.features.slice(0, 3).map((feature: any, index: number) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <span className="mr-2">✓</span>
                              <span>{feature.description}</span>
                            </li>
                          ))}
                        </ul>

                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed"
                          >
                            Current Plan
                          </button>
                        ) : (
                          <button 
                            onClick={() => handlePlanChange(plan.id)}
                            disabled={changingPlan}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {changingPlan && selectedPlan === plan.id
                              ? 'Updating...'
                              : plan.price > 99 
                                ? 'Upgrade' 
                                : plan.price === 0 
                                  ? 'Downgrade to Free'
                                  : 'Change Plan'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Account Settings</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                setNotification({ type: 'success', message: 'Account settings saved successfully!' });
                setTimeout(() => setNotification(null), 3000);
              }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full max-w-md border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                  <input
                    type="email"
                    defaultValue="john@example.com"
                    className="w-full max-w-md border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Company Name</label>
                  <input
                    type="text"
                    defaultValue="Acme Inc."
                    className="w-full max-w-md border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Team Members</h2>
              
              <div className="mb-6">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  + Invite Team Member
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-semibold text-gray-900">John Doe</p>
                    <p className="text-sm text-gray-600">john@example.com</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
                    <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-semibold text-gray-900">Jane Smith</p>
                    <p className="text-sm text-gray-600">jane@example.com</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">Member</span>
                    <button className="text-sm text-red-600 hover:text-red-800">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
