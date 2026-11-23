import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);
let sessionBootstrap = null;

async function bootstrapSession() {
  if (!sessionBootstrap) {
    sessionBootstrap = api.get('/auth/session')
      .then(({ data }) => data.user || null)
      .catch(() => null)
      .finally(() => { sessionBootstrap = null; });
  }
  return sessionBootstrap;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  };

  useEffect(() => {
    let active = true;
    bootstrapSession()
      .then((nextUser) => { if (active) setUser(nextUser); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
    return data.user;
  };
  const register = async (details) => {
    const { data } = await api.post('/auth/register', details);
    setUser(data.user);
    return data.user;
  };
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally { setUser(null); }
  };
  const value = useMemo(() => ({ user, setUser, loading, login, register, logout, reloadUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
