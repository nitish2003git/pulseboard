import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { LogOut, LayoutGrid, ChevronDown, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import Avatar from './ui/Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="transition-transform hover:scale-[1.02]">
          <Logo />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live connection indicator */}
          <div
            className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted sm:flex"
            title={connected ? 'Real-time connected' : 'Reconnecting…'}
          >
            <span className={`relative flex h-2 w-2`}>
              {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            {connected ? 'Live' : 'Offline'}
          </div>

          <NotificationBell />
          <ThemeToggle />

          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1 pl-1 pr-2 transition-colors hover:bg-surface-2"
            >
              <Avatar user={user} size="sm" />
              <ChevronDown size={15} className={`text-muted transition-transform ${menu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="card absolute right-0 z-50 mt-2 w-56 overflow-hidden shadow-pop"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-content">{user?.name}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                    {user?.role === 'admin' && (
                      <span className="chip mt-2 bg-accent-soft text-accent">
                        <ShieldCheck size={12} /> Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setMenu(false); navigate('/'); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content transition-colors hover:bg-surface-2"
                  >
                    <LayoutGrid size={16} className="text-muted" /> My Boards
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-sm text-danger transition-colors hover:bg-surface-2"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
