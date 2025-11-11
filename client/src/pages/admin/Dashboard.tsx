import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { adminAxiosInstance } from '../../utils/adminUtils';
import { Loader2 } from 'lucide-react';

type DiscountStatus = 'used' | 'available' | 'expired';

interface DiscountCode {
  id: number;
  code: string;
  userId: number | null;
  userMobileNo: string | null;
  orderNumber: number;
  discountPercent: number;
  isUsed: boolean;
  usedByOrderId: number | null;
  createdAt: string | null;
  status: DiscountStatus;
  isGlobalOrder: boolean;
}

interface CreateGlobalDiscountCodeRequest {
  orderNumber: number;
  discountPercent?: number;
}

interface CreateGlobalDiscountCodeResponse {
  message: string;
  data: {
    code: string;
    orderNumber: number;
    nextGlobalOrderNumber: number;
  };
}

interface StatisticsResponse {
  data: {
    itemsPurchased: number;
    totalPurchaseAmount: number;
    discountCodes: DiscountCode[];
    totalDiscountAmount: number;
  };
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuthStore();
  const [statistics, setStatistics] = useState<StatisticsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('10');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAxiosInstance.get<StatisticsResponse>('/api/v1/admin/statistics');
      setStatistics(response.data.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString + "Z").toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleCreateGlobalDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreatedCode(null);

    const orderNum = parseInt(orderNumber, 10);
    const discountPct = discountPercent ? parseFloat(discountPercent) : undefined;

    if (!orderNum || orderNum < 1) {
      setCreateError('Order number must be a positive number');
      return;
    }

    if (discountPct !== undefined && (discountPct < 0 || discountPct > 100)) {
      setCreateError('Discount percent must be between 0 and 100');
      return;
    }

    try {
      setCreateLoading(true);
      const payload: CreateGlobalDiscountCodeRequest = {
        orderNumber: orderNum,
      };
      if (discountPct !== undefined) {
        payload.discountPercent = discountPct;
      }

      const response = await adminAxiosInstance.post<CreateGlobalDiscountCodeResponse>(
        '/api/v1/admin/discount-codes',
        payload
      );

      setCreatedCode(response.data.data.code);
      // Refresh statistics
      await fetchStatistics();
      // Reset form
      setOrderNumber('');
      setDiscountPercent('10');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to create discount code';
      setCreateError(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setCreateError(null);
    setCreatedCode(null);
    setOrderNumber('');
    setDiscountPercent('10');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {admin?.username}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
            <span className="ml-3 text-gray-600">Loading statistics...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
              <Button onClick={fetchStatistics} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        ) : statistics ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📦</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Items Purchased
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {statistics.itemsPurchased.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">₹</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Purchase Amount
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {formatCurrency(statistics.totalPurchaseAmount)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🎫</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Discount Codes
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {statistics.discountCodes.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">💸</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Discount Amount
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {formatCurrency(statistics.totalDiscountAmount)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Codes Table */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Discount Codes</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                      Create Global Discount Code
                    </Button>
                    <Button onClick={fetchStatistics} variant="outline" size="sm">
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {statistics.discountCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No discount codes found</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Mobile
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Used By Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statistics.discountCodes.map((discount) => (
                        <tr key={discount.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-medium text-gray-900">
                              {discount.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {discount.userMobileNo || 'Global'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {discount.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                discount.isGlobalOrder
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {discount.isGlobalOrder ? 'Global' : 'User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {discount.discountPercent}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                discount.status === 'used'
                                  ? 'bg-red-100 text-red-800'
                                  : discount.status === 'expired'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {discount.status === 'used'
                                ? 'Used'
                                : discount.status === 'expired'
                                ? 'Expired'
                                : 'Available'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {discount.usedByOrderId || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(discount.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Create Global Discount Code Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Global Discount Code</DialogTitle>
            <DialogDescription>
              Create a discount code that can be used by any user for a specific global order number.
              The order number must match the next global order number.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGlobalDiscountCode}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label
                  htmlFor="orderNumber"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Order Number *
                </label>
                <input
                  id="orderNumber"
                  type="number"
                  placeholder="Enter the global order number"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    setCreateError(null);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  min="1"
                  disabled={createLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="discountPercent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Discount Percent (optional, default: 10%)
                </label>
                <input
                  id="discountPercent"
                  type="number"
                  placeholder="10"
                  value={discountPercent}
                  onChange={(e) => {
                    setDiscountPercent(e.target.value);
                    setCreateError(null);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={createLoading}
                />
              </div>
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}
              {createdCode && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm font-medium text-green-800">Discount code created successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Code: <span className="font-mono font-bold">{createdCode}</span>
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCreateDialog}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

