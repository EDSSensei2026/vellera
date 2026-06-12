import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'USER' | 'TRAINER' | 'DOCTOR';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedClients?: string[]; // Used strictly for Trainers/Doctors
}

interface AuthContextType {
  user: UserProfile | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Check local storage so desktop and mobile web views persist logins
    const saved = localStorage.getItem('vellera_session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (role: UserRole) => {
    const mockUser: UserProfile = {
      id: 'usr_9921',
      name: role === 'TRAINER' ? 'Coach Alexander' : 'Alex Johnson',
      email: 'alex@vellera.app',
      role: role,
      assignedClients: role === 'TRAINER' ? ['client_1', 'client_2', 'client_3'] : []
    };
    setUser(mockUser);
    localStorage.setItem('vellera_session', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vellera_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be wrapped within an AuthProvider');
  return context;
};
