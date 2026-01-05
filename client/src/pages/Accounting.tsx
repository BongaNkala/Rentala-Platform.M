import React, { useState, useMemo } from 'react';
import RentalaLayout from '@/components/RentalaLayout';
import { trpc } from '@/lib/trpc';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Accounting() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    propertyId: '',
    type: 'income' as const,
    category: 'rent',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = trpc.accounting.list.useQuery({
    propertyId: selectedProperty ? parseInt(selectedProperty) : undefined,
    startDate,
    endDate,
  });

  // Fetch financial summary
  const { data: summary, isLoading: summaryLoading } = trpc.accounting.getSummary.useQuery({
    propertyId: selectedProperty ? parseInt(selectedProperty) : undefined,
    startDate,
    endDate,
  });

  // Fetch income by property
  const { data: incomeByProperty } = trpc.accounting.getIncomeByProperty.useQuery({
    startDate,
    endDate,
  });

  // Fetch properties for dropdown
  const { data: properties } = trpc.properties.list.useQuery();

  // Create transaction mutation
  const createMutation = trpc.accounting.create.useMutation({
    onSuccess: () => {
      refetchTransactions();
      setShowCreateModal(false);
      setFormData({
        propertyId: '',
        type: 'income',
        category: 'rent',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
      });
    },
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      propertyId: parseInt(formData.propertyId),
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      reference: formData.reference || undefined,
    });
  };

  // Calculate totals
  const totalIncome = parseFloat(summary?.totalIncome || '0');
  const totalExpenses = parseFloat(summary?.totalExpenses || '0');
  const netProfit = parseFloat(summary?.netProfit || '0');

  // Format currency
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(num);
  };

  return (
    <RentalaLayout pageTitle="Accounting & Reports" pageSubtitle="Track transactions and generate financial statements">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300/80 text-sm font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-300 mt-2">{formatCurrency(totalIncome)}</p>
            </div>
            <TrendingUp size={40} className="text-green-500/40" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300/80 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-300 mt-2">{formatCurrency(totalExpenses)}</p>
            </div>
            <TrendingDown size={40} className="text-red-500/40" />
          </div>
        </Card>

        <Card className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-blue-500/20 to-blue-600/10 border border-blue-500/30' : 'from-orange-500/20 to-orange-600/10 border border-orange-500/30'} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${netProfit >= 0 ? 'text-blue-300/80' : 'text-orange-300/80'} text-sm font-medium`}>Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-300' : 'text-orange-300'} mt-2`}>{formatCurrency(netProfit)}</p>
            </div>
            <DollarSign size={40} className={netProfit >= 0 ? 'text-blue-500/40' : 'text-orange-500/40'} />
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 flex gap-4">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Properties</option>
            {properties?.map((prop: any) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Add Transaction
          </Button>

          <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
            <Download size={20} />
            Export
          </Button>
        </div>
      </div>

      {/* Property Performance */}
      {incomeByProperty && Object.keys(incomeByProperty).length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Property Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(incomeByProperty).map((prop: any) => (
              <Card key={prop.propertyId} className="bg-white/10 border border-white/20 p-4">
                <h4 className="text-lg font-semibold text-white mb-3">{prop.propertyName}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Income:</span>
                    <span className="text-green-300 font-semibold">{formatCurrency(prop.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Expenses:</span>
                    <span className="text-red-300 font-semibold">{formatCurrency(prop.expenses)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="text-white/70 font-medium">Profit:</span>
                    <span className={`font-bold ${prop.profit >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
                      {formatCurrency(prop.profit)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Transactions</h3>
        {transactionsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
            </div>
            <p className="text-white/60 mt-4">Loading transactions...</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((txn: any) => (
              <Card
                key={txn.id}
                className="bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${txn.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {txn.type === 'income' ? (
                          <TrendingUp size={20} className="text-green-400" />
                        ) : (
                          <TrendingDown size={20} className="text-red-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{txn.description}</h4>
                        <p className="text-white/60 text-sm">{txn.category} • {new Date(txn.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${txn.type === 'income' ? 'text-green-300' : 'text-red-300'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                    {txn.reference && (
                      <p className="text-white/60 text-xs">Ref: {txn.reference}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/10 border border-white/20 p-12 text-center">
            <div className="text-white/60 mb-4">
              <PieChart size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-white/60 mb-6">Add your first transaction to get started</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={20} className="mr-2" />
              Add Transaction
            </Button>
          </Card>
        )}
      </div>

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white/95 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Transaction</h2>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a property</option>
                    {properties?.map((prop: any) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., rent, maintenance, utilities"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ZAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Invoice #, Receipt #, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </RentalaLayout>
  );
}
