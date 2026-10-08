import { motion } from 'framer-motion';
import { Zap, Users, Bell, MoveHorizontal } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const FEATURES = [
  { icon: MoveHorizontal, title: 'Real-time Kanban', desc: 'Drag a card and everyone sees it move instantly.' },
  { icon: Users, title: 'Roles & permissions', desc: 'Admin / Member access, scoped per board.' },
  { icon: Bell, title: 'Live activity & alerts', desc: 'Assignments, moves and comments as they happen.' },
];

export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left brand panel — hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 grid-backdrop opacity-70" />
        <div
          className="absolute -left-20 top-1/3 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
        />
        <div className="relative">
          <Logo size={34} />
        </div>

        <div className="relative max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-content"
          >
            Where teams stay <span className="text-accent">in sync</span>, in real time.
          </motion.h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            PulseBoard keeps every board, card and comment updated live — no refresh, no guesswork.
          </p>

          <div className="mt-10 space-y-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-3.5"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-accent shadow-card">
                  <f.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-content">{f.title}</p>
                  <p className="text-[13px] text-muted">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-faint">
          <Zap size={13} /> Built with React · Node · Socket.io · MongoDB
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between p-5">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
