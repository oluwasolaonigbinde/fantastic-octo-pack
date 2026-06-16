// components/dashboard/admin-dashboard.tsx
import { UserData } from '@/types/user';

interface AdminDashboardProps {
  user: UserData;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Analytics</h2>
          <p className="text-gray-600">View platform-wide metrics and reports</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <p className="text-gray-600">Configure system settings</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;