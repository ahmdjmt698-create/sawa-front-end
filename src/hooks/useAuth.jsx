import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // عند فتح التطبيق: تحقق من الـ token المحفوظ
  useEffect(() => {
    const token = localStorage.getItem("sawa_token");
    if (token) {
      authAPI.me()
        .then(setUser)
        .catch(() => localStorage.removeItem("sawa_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem("sawa_token", data.access_token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    localStorage.setItem("sawa_token", data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("sawa_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
