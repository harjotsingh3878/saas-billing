'use client';

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
            <p className="text-3xl font-bold">Pro</p>
            <p className="text-sm text-gray-600">$99/month</p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Usage This Month</h3>
            <p className="text-3xl font-bold">8,542</p>
            <p className="text-sm text-gray-600">API Calls</p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Next Invoice</h3>
            <p className="text-3xl font-bold">$99</p>
            <p className="text-sm text-gray-600">Due Jan 15, 2024</p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Invoices</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">Invoice #INV-001</p>
                <p className="text-sm text-gray-600">December 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">$99.00</p>
                <span className="text-sm text-green-600">Paid</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">Invoice #INV-002</p>
                <p className="text-sm text-gray-600">November 2024</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">$99.00</p>
                <span className="text-sm text-green-600">Paid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
