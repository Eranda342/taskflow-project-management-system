import { io } from "socket.io-client";
import { getToken } from "./auth";

let socket = null;

// Usually matches backend port, e.g., http://localhost:5000 
// The Vite dev server proxies /api, but Socket.io often needs the full backend URL, 
// or if we rely on relative paths, it goes through the proxy if Vite config proxies WebSockets.
// Let's use the explicit backend URL if defined, otherwise fallback to window.location.origin
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000";

export const initSocket = () => {
  const token = getToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket) {
    // If socket exists and is connected, don't recreate
    if (socket.connected) return socket;
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling']
  });

  socket.on("connect", () => {
    // Socket connected
  });

  socket.on("disconnect", () => {
    // Socket disconnected
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
