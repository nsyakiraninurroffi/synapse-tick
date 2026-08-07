'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Ticket, Wallet, Tag, Info, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationItem {
  id: string;
  type: 'ticket' | 'wallet' | 'promo' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'system',
    title: 'Selamat Datang di SynapseTick!',
    message: 'Nikmati kemudahan beli tiket konser, e-wallet cashless, dan scan gate instan.',
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: 'notif-2',
    type: 'wallet',
    title: 'Saldo E-Wallet Demo',
    message: 'Saldo demo Rp 500.000 telah aktif. Siap digunakan untuk transaksi cashless!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
  },
];

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ticketflow_notifications');
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch { setNotifications(DEFAULT_NOTIFICATIONS); }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem('ticketflow_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }, []);

  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    localStorage.setItem('ticketflow_notifications', JSON.stringify(items));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ticket': return <Ticket className="w-4 h-4 text-brand-500" />;
      case 'wallet': return <Wallet className="w-4 h-4 text-emerald-500" />;
      case 'promo': return <Tag className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-accent-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] hover:text-brand-500 hover:border-brand-500/30 transition-all duration-200"
        aria-label="Notifikasi"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-black flex items-center justify-center shadow-glow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 card p-0 overflow-hidden shadow-card-dark border-brand-500/20 z-50"
          >
            {/* Header */}
            <div className="p-4 bg-[hsl(var(--bg-secondary))] border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-500" />
                <h4 className="text-sm font-bold text-[hsl(var(--text-primary))]">Notifikasi</h4>
                {unreadCount > 0 && (
                  <span className="badge-info text-[10px] font-bold py-0.5">{unreadCount} baru</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      title="Tandai semua dibaca"
                      className="p-1.5 rounded-lg text-xs text-[hsl(var(--text-muted))] hover:text-brand-500 hover:bg-[hsl(var(--bg-card))] transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={clearAll}
                      title="Hapus semua"
                      className="p-1.5 rounded-lg text-xs text-[hsl(var(--text-muted))] hover:text-red-500 hover:bg-[hsl(var(--bg-card))] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[hsl(var(--border-subtle))] no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Bell className="w-8 h-8 text-[hsl(var(--text-muted))] mx-auto opacity-30" />
                  <p className="text-xs text-[hsl(var(--text-muted))]">Belum ada notifikasi.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors flex items-start gap-3 ${
                      n.isRead ? 'bg-[hsl(var(--bg-card))] opacity-80' : 'bg-brand-500/5 font-medium'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-[hsl(var(--bg-secondary))] border border-[hsl(var(--border-subtle))] flex-shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{n.title}</p>
                        <span className="text-[10px] text-[hsl(var(--text-muted))]">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
