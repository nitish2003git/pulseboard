import { motion } from 'framer-motion';

export default function Logo({ size = 30, withWord = true }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="grid place-items-center rounded-xl shadow-card"
        style={{ width: size, height: size, backgroundColor: 'var(--accent)' }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" fill="none">
          <motion.path
            d="M4 16h5l2.5-7 4.5 14 3.5-10 2 3h6"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        </svg>
      </div>
      {withWord && (
        <span className="text-[17px] font-extrabold tracking-tight text-content">
          Pulse<span className="text-accent">Board</span>
        </span>
      )}
    </div>
  );
}
