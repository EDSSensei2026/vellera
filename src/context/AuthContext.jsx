import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vellera_session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (role) => {
    const mockUser = {
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
