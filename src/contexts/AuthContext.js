import { createContext, useContext, useState, useEffect } from 'react';
import { users } from '../auth/users';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage on init
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const user = users.find(u => 
      u.email === email && u.password === password
    );
    
    if (user) {
      const userData = { 
        email: user.email, 
        isAdmin: user.isAdmin,
        name: user.name
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setCurrentUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);