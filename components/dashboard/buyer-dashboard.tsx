// components/dashboard/buyer-dashboard.tsx
import { UserData } from '@/types/user';

interface BuyerDashboardProps {
  user: UserData;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ user }) => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Welcome back, {user.firstName}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
          <p className="text-gray-600">View and manage your recent orders</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Wishlist</h2>
          <p className="text-gray-600">Items you&apos;ve saved for later</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;