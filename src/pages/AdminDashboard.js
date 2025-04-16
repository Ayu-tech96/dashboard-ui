import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {currentUser?.name} (Admin)</p>
      <button onClick={logout}>Logout</button>
      
      {/* Admin-only features */}
      <div className="admin-tools">
        <h2>User Management</h2>
        {/* Add user management UI here */}
      </div>
    </div>
  );
}