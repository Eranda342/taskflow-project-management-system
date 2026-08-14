import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../lib/api";
import { getToken, setToken, removeToken, isAuthenticated } from "../lib/auth";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [authLoading, setAuthLoading] = useState(true);

  // Existing mock state to be replaced later
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(3);

  const addToast = useCallback((type, message) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (!getToken()) {
        setUser(null);
        setRole(null);
        setIsAuth(false);
        setAuthLoading(false);
        return;
      }
      const { data } = await api.get("/auth/me");
      if (data.success && data.data && data.data.user) {
        setUser(data.data.user);
        setRole(data.data.user.role);
        setIsAuth(true);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      removeToken();
      setUser(null);
      setRole(null);
      setIsAuth(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    if (data.success && data.data) {
      setToken(data.data.token);
      setIsAuth(true);
      if (data.data.user) {
        setUser(data.data.user);
        setRole(data.data.user.role);
      } else {
        await refreshUser();
      }
    }
    return data;
  };

  const register = async (userData) => {
    const { data } = await api.post("/auth/register", userData);
    return data;
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setRole(null);
    setIsAuth(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        isAuth,
        authLoading,
        login,
        register,
        logout,
        refreshUser,
        toasts,
        addToast,
        removeToast,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
