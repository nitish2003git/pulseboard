import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, LogIn, LayoutGrid, CheckCircle2, Users2, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { AvatarStack } from '../components/ui/Avatar';

const COLORS = ['#5b57d1', '#0ea5b7', '#2f9e6b', '#b0842f', '#c2632c', '#8b5cf6', '#c0435a', '#4b6bde'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get('/boards')
      .then(({ data }) => setBoards(data.boards))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const createBoard = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post('/boards', form);
      setBoards((b) => [{ ...data.board, taskCount: 0, doneCount: 0, myRole: 'admin' }, ...b]);
      setShowCreate(false);
      setForm({ name: '', description: '', color: COLORS[0] });
      toast.success('Board created');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const joinBoard = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/boards/join', { inviteCode });
      toast.success(data.alreadyMember ? "You're already on this board" : `Joined “${data.board.name}”`);
      setShowJoin(false);
      setInviteCode('');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalTasks = boards.reduce((s, b) => s + (b.taskCount || 0), 0);
  const totalDone = boards.reduce((s, b) => s + (b.doneCount || 0), 0);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-muted">{greeting()},</p>
            <h1 className="mt-0.5 flex items-center gap-2 text-2xl font-bold tracking-tight text-content">
              {user?.name?.split(' ')[0]}
              {user?.role === 'admin' && (
                <span className="chip bg-accent-soft text-accent"><ShieldCheck size={12} /> Admin</span>
              )}
            </h1>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setShowJoin(true)} className="btn-outline">
              <LogIn size={16} /> Join board
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> New board
            </button>
          </div>
        </motion.div>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { icon: LayoutGrid, label: 'Boards', value: boards.length, tint: 'var(--accent)' },
            { icon: CheckCircle2, label: 'Tasks completed', value: `${totalDone}/${totalTasks}`, tint: 'var(--prio-medium)' },
            { icon: Users2, label: 'Role', value: user?.role === 'admin' ? 'Admin' : 'Member', tint: 'var(--prio-low)' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.1 }}
              className="card flex items-center gap-3 p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ backgroundColor: 'var(--accent-soft)', color: s.tint }}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none text-content">{s.value}</p>
                <p className="mt-1 text-xs text-muted">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Board grid */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted">Your boards</h2>
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size={26} className="text-accent" /></div>
          ) : boards.length === 0 ? (
            <EmptyBoards onCreate={() => setShowCreate(true)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((b, i) => (
                <BoardCard key={b._id} board={b} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create board modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create a new board"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
            <button onClick={createBoard} disabled={busy || !form.name.trim()} className="btn-primary">
              {busy ? <Spinner size={15} /> : 'Create board'}
            </button>
          </>
        }
      >
        <form onSubmit={createBoard} className="space-y-4">
          <div>
            <label className="label mb-1.5 block">Board name</label>
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marketing Sprint" className="input" />
          </div>
          <div>
            <label className="label mb-1.5 block">Description <span className="font-normal normal-case text-faint">(optional)</span></label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What's this board about?" className="input resize-none" />
          </div>
          <div>
            <label className="label mb-2 block">Accent color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c, '--tw-ring-color': c }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Join board modal */}
      <Modal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        title="Join a board"
        footer={
          <>
            <button onClick={() => setShowJoin(false)} className="btn-ghost">Cancel</button>
            <button onClick={joinBoard} disabled={busy || !inviteCode.trim()} className="btn-primary">
              {busy ? <Spinner size={15} /> : 'Join board'}
            </button>
          </>
        }
      >
        <form onSubmit={joinBoard} className="space-y-2">
          <label className="label mb-1.5 block">Invite code</label>
          <input
            autoFocus
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="PB-XXXXXX"
            className="input font-mono tracking-widest"
          />
          <p className="flex items-center gap-1.5 pt-1 text-xs text-muted">
            <Sparkles size={13} /> Ask a board admin for their invite code.
          </p>
        </form>
      </Modal>
    </div>
  );
}

function BoardCard({ board, index }) {
  const pct = board.taskCount ? Math.round((board.doneCount / board.taskCount) * 100) : 0;
  const members = (board.members || []).map((m) => m.user).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.35 }}
    >
      <Link
        to={`/boards/${board._id}`}
        className="card group block overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-pop"
      >
        <div className="h-1.5 w-full" style={{ backgroundColor: board.color }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-content transition-colors group-hover:text-accent">{board.name}</h3>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] text-muted">{board.description || 'No description yet.'}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted">{board.doneCount}/{board.taskCount} done</span>
              <span className="font-semibold text-content">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: board.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <AvatarStack users={members} max={4} />
            <span className={`chip ${board.myRole === 'admin' ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-muted'}`}>
              {board.myRole === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyBoards({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft text-accent">
        <LayoutGrid size={28} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-content">No boards yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">Create your first board to start organizing work with your team in real time.</p>
      </div>
      <button onClick={onCreate} className="btn-primary"><Plus size={16} /> Create your first board</button>
    </motion.div>
  );
}
