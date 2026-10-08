import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <Logo size={36} />
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-7xl font-extrabold tracking-tight text-accent"
      >
        404
      </motion.h1>
      <p className="max-w-sm text-muted">This board seems to have drifted off. Let's get you back on track.</p>
      <Link to="/" className="btn-primary">Back to my boards</Link>
    </div>
  );
}
