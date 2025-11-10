import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAdminAuthStore } from '../../store/adminAuthStore';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin');
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
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Admin Panel
          </h2>
          <p className="text-gray-600">
            This is the admin dashboard. You can add more admin features here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

