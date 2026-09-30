import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  timeAgo?: string;
  category: 'detection' | 'processing' | 'system' | 'high_priority';
  portName?: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'New High-Priority Anomaly Detected',
    message: 'Model detected Submerged Target (88% confidence) via SSS acoustic shadow analysis in Sector 7A.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    timeAgo: '2 mins ago',
    category: 'high_priority',
    portName: 'Mumbai Harbor Q3',
    type: 'danger',
    read: false,
    link: '/map'
  },
  {
    id: 'notif_2',
    title: 'Survey Processing Complete',
    message: 'Survey "Mumbai Harbor Q3" scan & swath normalization completed.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    timeAgo: '1 hr ago',
    category: 'processing',
    portName: 'System',
    type: 'success',
    read: false,
    link: '/processing'
  },
  {
    id: 'notif_3',
    title: 'AI Model Pipeline Update',
    message: 'Model v1.1 retraining scheduled for 03:00 IST.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    timeAgo: '3 hrs ago',
    category: 'system',
    portName: 'AI Pipeline',
    type: 'info',
    read: true,
    link: '/dashboard'
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('sagarnet_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (e) {
      console.error('Failed to load notifications from storage', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sagarnet_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date(),
      timeAgo: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
