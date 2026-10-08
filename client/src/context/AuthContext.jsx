import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pb-user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, u) => {
    localStorage.setItem('pb-token', token);
    localStorage.setItem('pb-user', JSON.stringify(u));
    setUser(u);
    connectSocket(token);
  }, []);

  // On boot, if we have a token, verify it and refresh the user.
  useEffect(() => {
    const token = localStorage.getItem('pb-token');
    if (!token) {
      setLoading(false);
      return;
    }
    connectSocket(token);
    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('pb-user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('pb-token');
        localStorage.removeItem('pb-user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pb-token');
    localStorage.removeItem('pb-user');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
