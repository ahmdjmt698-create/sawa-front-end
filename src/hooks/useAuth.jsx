import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  // التحقق من هوية المستخدم عند بدء التطبيق
  const verifyToken = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await authAPI.me();
      setUser(userData);
      setVerified(true);
    } catch {
      setUser(null);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setUser(data.user);
    setVerified(true);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    setUser(data.user);
    setVerified(true);
    return data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    setUser(null);
    setVerified(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, verified, login, register, logout, refresh: verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
