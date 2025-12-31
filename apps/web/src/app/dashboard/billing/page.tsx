"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import DashboardNav from "../../../components/DashboardNav";
import { GET_INVOICES, GET_SUBSCRIPTION_BY_TENANT } from "../../../graphql/queries";
import { CANCEL_SUBSCRIPTION, UPDATE_SUBSCRIPTION } from "../../../graphql/mutations";

export default function BillingPage() {
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // TODO: Get actual tenantId from auth context
  const tenantId = "tenant_demo_123";
  const {
    loading: invoicesLoading,
    error: invoicesError,
    data: invoicesData,
  } = useQuery(GET_INVOICES, {
    variables: { tenantId },
    skip: !tenantId, // Skip query if no tenantId
  });

  const { data: subscriptionData, refetch: refetchSubscription } = useQuery(GET_SUBSCRIPTION_BY_TENANT, {
    variables: { tenantId },
  });

  const [cancelSubscriptionMutation] = useMutation(CANCEL_SUBSCRIPTION);
  const [updateSubscription] = useMutation(UPDATE_SUBSCRIPTION);

  const subscriptionId = subscriptionData?.subscriptionByTenant?.id;
  const currentPeriodEnd = subscriptionData?.subscriptionByTenant?.currentPeriodEnd;
  const cancelAtPeriodEnd = subscriptionData?.subscriptionByTenant?.cancelAtPeriodEnd;

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDownloadInvoice = (invoice: any) => {
    // For production: use S3 PDF if available
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, "_blank");
      showNotification("success", `Opening invoice ${invoice.id}...`);
      return;
    }

    // For local development: generate text-based invoice
    const invoiceText = `
INVOICE

Invoice ID: ${invoice.id}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Status: ${invoice.status}

Bill To:
Tenant ID: ${invoice.tenantId}

LINE ITEMS:
${invoice.lineItems
  .map(
    (item: any, idx: number) => `
${idx + 1}. ${item.description}
   Quantity: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.amount.toFixed(2)}
`
  )
  .join("\n")}

TOTAL: $${invoice.amount.toFixed(2)} ${invoice.currency}
${invoice.paidAt ? `\nPaid on: ${new Date(invoice.paidAt).toLocaleDateString()}` : ""}

---
Generated on ${new Date().toLocaleString()}
    `.trim();

    // Create a blob and download
    const blob = new Blob([invoiceText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification("success", `Invoice ${invoice.id} downloaded!`);
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionId) {
      showNotification("error", "Subscription not found.");
      return;
    }

    setIsProcessing(true);
    try {
      await cancelSubscriptionMutation({
        variables: { id: subscriptionId },
      });
      
      await refetchSubscription();
      
      const endDate = currentPeriodEnd 
        ? new Date(currentPeriodEnd).toLocaleDateString()
        : 'the end of your billing period';
      
      showNotification(
        "success",
        `Subscription cancelled successfully. You'll retain access until ${endDate}.`
      );
      setShowCancelModal(false);
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
      showNotification(
        "error",
        err.message || "Failed to cancel subscription. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePayment = async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement actual payment method update
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showNotification("success", "Payment method updated successfully!");
      setShowPaymentModal(false);
    } catch (err) {
      showNotification(
        "error",
        "Failed to update payment method. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddPayment = async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement actual payment method addition
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showNotification("success", "Payment method added successfully!");
      setShowAddPaymentModal(false);
    } catch (err) {
      showNotification(
        "error",
        "Failed to add payment method. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePayment = async () => {
    if (!confirm("Are you sure you want to remove this payment method?"))
      return;

    setIsProcessing(true);
    try {
      // TODO: Implement actual payment method removal
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification("success", "Payment method removed successfully!");
    } catch (err) {
      showNotification(
        "error",
        "Failed to remove payment method. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscriptionId) {
      showNotification("error", "Subscription not found.");
      return;
    }

    setIsProcessing(true);
    try {
      await updateSubscription({
        variables: {
          id: subscriptionId,
          input: { cancelAtPeriodEnd: false },
        },
      });

      await refetchSubscription();

      showNotification(
        "success",
        "Subscription reactivated! Your plan will continue after the current period."
      );
    } catch (err: any) {
      console.error("Reactivate subscription error:", err);
      showNotification(
        "error",
        err.message || "Failed to reactivate subscription. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Billing</h1>

          {/* Notification Banner */}
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                notification.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
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

          {/* Current Subscription */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Current Subscription
            </h2>
            
            {/* Cancellation Warning */}
            {cancelAtPeriodEnd && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-800">Subscription Scheduled for Cancellation</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your subscription will end on {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'the end of your billing period'}. 
                      You'll retain access until then.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan</p>
                <p className="text-2xl font-bold text-gray-900">Pro Plan</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  $99.00 / month
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  January 15, 2026
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="text-lg font-semibold text-gray-900">•••• 4242</p>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              >
                Update Payment Method
              </button>
              {cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={isProcessing}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Reactivate Subscription'}
                </button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="border border-red-300 text-red-700 px-6 py-2 rounded hover:bg-red-50 transition"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Invoice History
            </h2>

            {invoicesLoading && (
              <p className="text-center py-8 text-gray-600">
                Loading invoices...
              </p>
            )}

            {invoicesError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded">
                Failed to load invoices. Using demo data.
              </div>
            )}

            <div className="space-y-4">
              {(!invoicesData || invoicesData.invoicesByTenant.length === 0) &&
                !invoicesLoading && (
                  <>
                    {/* Demo/Fallback Data */}
                    <p className="text-sm text-gray-500 mb-4 italic">
                      Demo invoices (no data in database yet)
                    </p>
                    {[
                      {
                        id: "INV-005",
                        date: "Dec 15, 2025",
                        amount: 99.0,
                        status: "Paid",
                      },
                      {
                        id: "INV-004",
                        date: "Nov 15, 2025",
                        amount: 99.0,
                        status: "Paid",
                      },
                      {
                        id: "INV-003",
                        date: "Oct 15, 2025",
                        amount: 99.0,
                        status: "Paid",
                      },
                      {
                        id: "INV-002",
                        date: "Sep 15, 2025",
                        amount: 29.0,
                        status: "Paid",
                      },
                      {
                        id: "INV-001",
                        date: "Aug 15, 2025",
                        amount: 29.0,
                        status: "Paid",
                      },
                    ].map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex justify-between items-center py-4 border-b"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {invoice.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            {invoice.date}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              ${invoice.amount.toFixed(2)}
                            </p>
                            <span className="text-sm text-green-600">
                              {invoice.status}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

              {/* Real Data from Database */}
              {invoicesData && invoicesData.invoicesByTenant.length > 0 && (
                <>
                  {invoicesData.invoicesByTenant.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center py-4 border-b"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {invoice.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(invoice.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            ${invoice.amount.toFixed(2)} {invoice.currency}
                          </p>
                          <span
                            className={`text-sm ${
                              invoice.status === "PAID"
                                ? "text-green-600"
                                : invoice.status === "OPEN"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Payment Methods
            </h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      •••• •••• •••• 4242
                    </p>
                    <p className="text-sm text-gray-600">Expires 12/2026</p>
                  </div>
                  <span className="ml-4 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Default
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleRemovePayment}
                    disabled={isProcessing}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                <span>+</span> Add Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Cancel Subscription
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel your Pro plan subscription? You'll
              continue to have access until January 15, 2026.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Update Payment Method
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdatePayment();
              }}
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Add Payment Method
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddPayment();
              }}
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full border rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? "Adding..." : "Add Payment Method"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
