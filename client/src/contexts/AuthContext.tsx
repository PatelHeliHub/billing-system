import React, { createContext, useContext, useState, useEffect } from 'react';

interface Permission {
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: {
    name: string;
    permissions: Permission[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  hasPermission: (module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user', err);
        logout(); // Clear corrupted data
      }
    }
    setLoading(false);
  }, [token]);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermission = (module: string, action: keyof Permission) => {
    if (!user || !user.role) return false;
    if (user.role.name === 'Admin') return true; // Admins are powerful

    const perm = user.role.permissions.find(p => p.moduleName === module);
    return perm ? !!perm[action] : false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
