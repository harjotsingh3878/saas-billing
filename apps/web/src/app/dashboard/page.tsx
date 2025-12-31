'use client';

import Link from 'next/link';
import DashboardNav from '../../components/DashboardNav';

export default function DashboardPage() {
  return (
    <>
      <DashboardNav />
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/dashboard/settings" className="border rounded-lg p-6 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Current Plan</h3>
              <p className="text-3xl font-bold text-gray-900">Pro</p>
              <p className="text-sm text-gray-600">$99/month</p>
              <p className="text-sm text-blue-600 mt-2">Change plan →</p>
            </Link>
            <Link href="/dashboard/usage" className="border rounded-lg p-6 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Usage This Month</h3>
              <p className="text-3xl font-bold text-gray-900">8,542</p>
              <p className="text-sm text-gray-600">API Calls</p>
              <p className="text-sm text-blue-600 mt-2">View details →</p>
            </Link>
            <Link href="/dashboard/billing" className="border rounded-lg p-6 bg-white hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Next Invoice</h3>
              <p className="text-3xl font-bold text-gray-900">$99</p>
              <p className="text-sm text-gray-600">Due Jan 15, 2026</p>
              <p className="text-sm text-blue-600 mt-2">View billing →</p>
            </Link>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Recent Invoices</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Invoice #INV-005</p>
                  <p className="text-sm text-gray-600">December 2025</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">$99.00</p>
                  <span className="text-sm text-green-600">Paid</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Invoice #INV-004</p>
                  <p className="text-sm text-gray-600">November 2025</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">$99.00</p>
                  <span className="text-sm text-green-600">Paid</span>
                </div>
              </div>
            </div>
            <Link href="/dashboard/billing" className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-4 inline-block">
              View all invoices →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
