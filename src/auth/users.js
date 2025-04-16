// Pre-defined users (insecure - for demo only!)
export const users = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'admin123', // Never store plain passwords in production!
    isAdmin: true,
    name: 'Admin User'
  },
  {
    id: 2,
    email: 'user@example.com',
    password: 'user123',
    isAdmin: false,
    name: 'Regular User'
  }
];