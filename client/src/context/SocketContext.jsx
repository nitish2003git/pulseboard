import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';
import api from '../lib/api';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  // Load existing notifications once logged in.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      return;
    }
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.notifications);
      setUnread(data.unread);
    });
  }, [user]);

  // Wire up global socket listeners (connection status + live notifications).
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNotification = (n) => {
      setNotifications((prev) => {
        if (prev.some((x) => x._id === n._id)) return prev;
        return [n, ...prev].slice(0, 50);
      });
      setUnread((u) => u + 1);
      toast(n.message, { icon: '🔔' });
    };

    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', onNotification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', onNotification);
    };
  }, [user]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await api.patch(`/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api.patch('/notifications/read-all').catch(() => {});
  }, []);

  return (
    <SocketContext.Provider value={{ connected, notifications, unread, markRead, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
