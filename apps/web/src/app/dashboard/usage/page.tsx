'use client';

import DashboardNav from '../../../components/DashboardNav';

export default function UsagePage() {
  return (
    <>
      <DashboardNav />
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Usage</h1>

          {/* Current Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">API Calls</h3>
              <p className="text-3xl font-bold text-blue-600">8,542</p>
              <p className="text-sm text-gray-600">of 100,000 this month</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '8.5%' }}></div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Storage</h3>
              <p className="text-3xl font-bold text-green-600">45 GB</p>
              <p className="text-sm text-gray-600">of 100 GB</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Team Members</h3>
              <p className="text-3xl font-bold text-purple-600">2</p>
              <p className="text-sm text-gray-600">of 20 users</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          {/* Usage History */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">API Usage History</h2>
            <div className="space-y-4">
              {[
                { date: 'Dec 30, 2025', calls: 1245, status: 'normal' },
                { date: 'Dec 29, 2025', calls: 987, status: 'normal' },
                { date: 'Dec 28, 2025', calls: 2156, status: 'normal' },
                { date: 'Dec 27, 2025', calls: 1534, status: 'normal' },
                { date: 'Dec 26, 2025', calls: 876, status: 'normal' },
              ].map((entry, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.date}</p>
                    <p className="text-sm text-gray-600">API Calls</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{entry.calls.toLocaleString()}</p>
                    <span className="text-sm text-green-600">Normal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Feature Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Webhooks</h3>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">145</p>
                <p className="text-sm text-gray-600">Events sent this month</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Custom Integrations</h3>
                  <span className="text-sm text-blue-600">Enabled</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-600">Active integrations</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Analytics Queries</h3>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">89</p>
                <p className="text-sm text-gray-600">Queries this month</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Support Requests</h3>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-600">Priority support tickets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
