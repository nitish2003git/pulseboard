import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { timeAgo } from '../lib/format';
import Avatar from './ui/Avatar';

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onOpen = (n) => {
    markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-content hover:bg-surface-2"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-[var(--prio-urgent)] px-1 text-[10px] font-bold text-white"
            style={{ height: 18 }}
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="card absolute right-0 z-50 mt-2 w-80 overflow-hidden shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h4 className="text-sm font-semibold text-content">Notifications</h4>
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  <Bell size={22} className="mx-auto mb-2 opacity-40" />
                  You're all caught up
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => onOpen(n)}
                    className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                      !n.read ? 'bg-accent-soft' : ''
                    }`}
                  >
                    {n.actor ? <Avatar user={n.actor} size="sm" /> : <div className="grid h-7 w-7 place-items-center rounded-full bg-surface-3"><Bell size={13} /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-content">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-faint">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
