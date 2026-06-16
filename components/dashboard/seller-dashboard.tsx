// components/dashboard/seller-dashboard.tsx
import { UserData } from '@/types/user';

interface SellerDashboardProps {
  user: UserData;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user }) => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Seller Dashboard - {`${user.firstName}'s Store`}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <p className="text-gray-600">Manage your product listings</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          <p className="text-gray-600">View and fulfill customer orders</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="text-gray-600">Track your sales performance</p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;