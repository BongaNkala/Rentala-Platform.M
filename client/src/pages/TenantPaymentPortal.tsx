import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Download, History, AlertCircle, CheckCircle } from 'lucide-react';
// import { trpc } from '@/lib/trpc';

interface RentPayment {
  id: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  paymentMethod?: string;
  receiptUrl?: string;
  reference?: string;
}

interface PaymentHistory {
  id: number;
  amount: number;
  paidDate: Date;
  status: string;
  paymentMethod: string;
  receiptUrl?: string;
}

export default function TenantPaymentPortal() {
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to access the payment portal</h1>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  const [upcomingPayments, setUpcomingPayments] = useState<RentPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch upcoming payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from tRPC
        // const payments = await trpc.tenant.getUpcomingPayments.useQuery();
        // For now, we'll use mock data
        setUpcomingPayments([
          {
            id: 1,
            amount: 6500,
            dueDate: new Date(2026, 2, 15),
            status: 'pending',
          },
          {
            id: 2,
            amount: 6500,
            dueDate: new Date(2026, 3, 15),
            status: 'pending',
          },
        ]);

        setPaymentHistory([
          {
            id: 1,
            amount: 6500,
            paidDate: new Date(2026, 1, 10),
            status: 'paid',
            paymentMethod: 'card',
            receiptUrl: '#',
          },
          {
            id: 2,
            amount: 6500,
            paidDate: new Date(2025, 12, 10),
            status: 'paid',
            paymentMethod: 'card',
            receiptUrl: '#',
          },
        ]);
      } catch (err) {
        setError('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handlePayNow = async (payment: RentPayment) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      // In a real app, this would call tRPC to create a checkout session
      // const session = await trpc.tenant.createPaymentCheckout.useMutation();

      // For now, show a message
      setSuccess(`Payment of R ${payment.amount.toLocaleString()} initiated. Redirecting to payment...`);
      setSelectedPayment(null);

      // Simulate redirect to Stripe
      setTimeout(() => {
        window.open('https://checkout.stripe.com', '_blank');
      }, 1500);
    } catch (err) {
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = (payment: PaymentHistory) => {
    if (payment.receiptUrl) {
      window.open(payment.receiptUrl, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'overdue':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20';
      case 'pending':
        return 'bg-yellow-500/20';
      case 'overdue':
        return 'bg-red-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Rent Payment Portal</h1>
          <p className="text-gray-400">Manage your rent payments and download receipts</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Upcoming Payments */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Upcoming Payments</h2>
          {upcomingPayments.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <p className="text-gray-400">No upcoming payments</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingPayments.map((payment) => (
                <Card
                  key={payment.id}
                  className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <CreditCard size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Rent Payment</h3>
                        <p className="text-gray-400 text-sm">
                          Due: {new Date(payment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(payment.status)} ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </div>
                  </div>

                  <div className="mb-6 pb-6 border-b border-white/10">
                    <p className="text-3xl font-bold text-white">
                      R {payment.amount.toLocaleString()}
                    </p>
                  </div>

                  <Button
                    onClick={() => handlePayNow(payment)}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {processing ? 'Processing...' : 'Pay Now'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <History size={28} />
            Payment History
          </h2>

          {paymentHistory.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <p className="text-gray-400">No payment history</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Date</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Amount</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Method</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-white">
                        {new Date(payment.paidDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-white font-semibold">
                        R {payment.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(payment.status)} ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {payment.paymentMethod === 'card' ? 'Credit Card' : payment.paymentMethod}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleDownloadReceipt(payment)}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Download size={18} />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-400">
            <div>
              <p className="text-sm">Accepted Payment Methods</p>
              <p className="text-white font-semibold">Credit Card, Debit Card</p>
            </div>
            <div>
              <p className="text-sm">Payment Processing</p>
              <p className="text-white font-semibold">Instant (via Stripe)</p>
            </div>
            <div>
              <p className="text-sm">Receipts</p>
              <p className="text-white font-semibold">Automatically emailed & available for download</p>
            </div>
            <div>
              <p className="text-sm">Support</p>
              <p className="text-white font-semibold">Contact your landlord for assistance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
