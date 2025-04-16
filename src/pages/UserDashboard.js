import { useAuth } from '../contexts/AuthContext';

export default function UserDashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="dashboard">
      <h1>User Dashboard</h1>
      <p>Welcome, {currentUser?.name}</p>
      <button onClick={logout}>Logout</button>
      
      {/* Regular user content */}
      <div className="user-content">
        <h2>Your Data</h2>
        {/* User-specific content here */}
      </div>
    </div>
  );
}