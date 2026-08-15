import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../lib/api";
import { getToken, setToken, removeToken, isAuthenticated } from "../lib/auth";
import { initSocket, disconnectSocket } from "../lib/socket";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [authLoading, setAuthLoading] = useState(true);

  // Existing state
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      if (data.success && data.data) {
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread notifications count", error);
    }
  }, []);

  const setupSocket = useCallback(() => {
    const socket = initSocket();
    if (!socket) return;
    
    // Prevent duplicate listeners
    socket.off("notification:new");
    
    socket.on("notification:new", (notification) => {
      setUnreadCount((prev) => prev + 1);
      
      // Optionally show a toast for real-time notification
      addToast("info", notification.message || "New notification received");
    });
  }, [addToast]);

  const refreshUser = useCallback(async () => {
    try {
      if (!getToken()) {
        setUser(null);
        setRole(null);
        setIsAuth(false);
        setAuthLoading(false);
        disconnectSocket();
        return;
      }
      const { data } = await api.get("/auth/me");
      if (data.success && data.data && data.data.user) {
        setUser(data.data.user);
        setRole(data.data.user.role);
        setIsAuth(true);
        setupSocket();
        fetchUnreadCount();
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      removeToken();
      setUser(null);
      setRole(null);
      setIsAuth(false);
      disconnectSocket();
    } finally {
      setAuthLoading(false);
    }
  }, [setupSocket, fetchUnreadCount]);

  useEffect(() => {
    refreshUser();
    
    return () => {
      disconnectSocket();
    };
  }, [refreshUser]);

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    if (data.success && data.data) {
      setToken(data.data.token);
      setIsAuth(true);
      if (data.data.user) {
        setUser(data.data.user);
        setRole(data.data.user.role);
        setupSocket();
        fetchUnreadCount();
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
    setUnreadCount(0);
    disconnectSocket();
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
