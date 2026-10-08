import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Settings2, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FullPageLoader } from '../components/ui/Spinner';
import Avatar, { AvatarStack } from '../components/ui/Avatar';
import KanbanBoard from '../components/board/KanbanBoard';
import ActivityFeed from '../components/board/ActivityFeed';
import TaskModal from '../components/board/TaskModal';
import CreateTaskModal from '../components/board/CreateTaskModal';
import MembersModal from '../components/board/MembersModal';
import BoardSettingsModal from '../components/board/BoardSettingsModal';

export default function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [myRole, setMyRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [createStatus, setCreateStatus] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menu, setMenu] = useState(false);
  const [presence, setPresence] = useState([]);
  const [draggingMap, setDraggingMap] = useState({});
  const dragTimers = useRef({});
  const menuRef = useRef(null);

  // ---- Initial load ----
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.get(`/boards/${id}`), api.get(`/boards/${id}/activity`)])
      .then(([b, a]) => {
        if (!active) return;
        setBoard(b.data.board);
        setTasks(b.data.tasks);
        setMyRole(b.data.myRole);
        setActivity(a.data.activity);
      })
      .catch((err) => {
        toast.error(err.message);
        navigate('/');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, navigate]);

  // ---- Real-time wiring ----
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('board:join', id);

    const upsert = (list, item) => {
      const i = list.findIndex((t) => t._id === item._id);
      if (i === -1) return [...list, item];
      const copy = [...list];
      copy[i] = item;
      return copy;
    };

    const onCreated = (task) => setTasks((t) => upsert(t, task));
    const onUpdated = (task) => setTasks((t) => upsert(t, task));
    const onMoved = ({ task, movedBy }) => {
      setTasks((t) => upsert(t, task));
      if (movedBy && movedBy.id !== String(user._id)) {
        // clear any transient "moving" cue for this card
        setDraggingMap((m) => {
          const c = { ...m };
          delete c[task._id];
          return c;
        });
      }
    };
    const onDeleted = ({ taskId }) => {
      setTasks((t) => t.filter((x) => x._id !== taskId));
      setOpenTaskId((cur) => (cur === taskId ? null : cur));
    };
    const onComment = ({ taskId, commentCount }) =>
      setTasks((t) => t.map((x) => (x._id === taskId ? { ...x, commentCount } : x)));
    const onActivity = (a) => setActivity((prev) => (prev.some((x) => x._id === a._id) ? prev : [a, ...prev].slice(0, 60)));
    const onBoardUpdated = (b) => setBoard((prev) => ({ ...prev, ...b }));
    const onMemberAdded = ({ board: b }) => setBoard(b);
    const onBoardDeleted = () => {
      toast('This board was deleted', { icon: '🗑️' });
      navigate('/');
    };
    const onPresenceSync = (users) => setPresence(users.filter((u) => u.id !== String(user._id)));
    const onPresenceJoin = (u) =>
      u.id !== String(user._id) && setPresence((p) => (p.some((x) => x.id === u.id) ? p : [...p, u]));
    const onPresenceLeave = (u) => setPresence((p) => p.filter((x) => x.id !== u.id));
    const onDragging = ({ taskId, user: u }) => {
      if (!taskId || u.id === String(user._id)) return;
      setDraggingMap((m) => ({ ...m, [taskId]: u.name.split(' ')[0] }));
      clearTimeout(dragTimers.current[taskId]);
      dragTimers.current[taskId] = setTimeout(() => {
        setDraggingMap((m) => {
          const c = { ...m };
          delete c[taskId];
          return c;
        });
      }, 2500);
    };

    socket.on('task:created', onCreated);
    socket.on('task:updated', onUpdated);
    socket.on('task:moved', onMoved);
    socket.on('task:deleted', onDeleted);
    socket.on('comment:added', onComment);
    socket.on('activity:new', onActivity);
    socket.on('board:updated', onBoardUpdated);
    socket.on('board:member-added', onMemberAdded);
    socket.on('board:deleted', onBoardDeleted);
    socket.on('presence:sync', onPresenceSync);
    socket.on('presence:join', onPresenceJoin);
    socket.on('presence:leave', onPresenceLeave);
    socket.on('task:dragging', onDragging);

    return () => {
      socket.emit('board:leave', id);
      socket.off('task:created', onCreated);
      socket.off('task:updated', onUpdated);
      socket.off('task:moved', onMoved);
      socket.off('task:deleted', onDeleted);
      socket.off('comment:added', onComment);
      socket.off('activity:new', onActivity);
      socket.off('board:updated', onBoardUpdated);
      socket.off('board:member-added', onMemberAdded);
      socket.off('board:deleted', onBoardDeleted);
      socket.off('presence:sync', onPresenceSync);
      socket.off('presence:join', onPresenceJoin);
      socket.off('presence:leave', onPresenceLeave);
      socket.off('task:dragging', onDragging);
    };
  }, [id, user._id, navigate]);

  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ---- Actions ----
  const handleMove = useCallback(
    (taskId, status, order) => {
      // Optimistic update for a snappy feel; the server echo keeps everyone in sync.
      setTasks((t) => t.map((x) => (x._id === taskId ? { ...x, status, order } : x)));
      api.patch(`/tasks/${taskId}/move`, { status, order }).catch((err) => {
        toast.error(err.message);
        // Reload to recover from a rejected move.
        api.get(`/boards/${id}`).then(({ data }) => setTasks(data.tasks));
      });
    },
    [id]
  );

  const handleDragStart = useCallback(
    (taskId) => {
      getSocket()?.emit('task:dragging', { boardId: id, taskId });
    },
    [id]
  );

  const members = useMemo(() => (board?.members || []).map((m) => m.user).filter(Boolean), [board]);
  const openTask = useMemo(() => tasks.find((t) => t._id === openTaskId) || null, [tasks, openTaskId]);
  const canManageTask = (task) =>
    task && (String(task.createdBy?._id || task.createdBy) === String(user._id) || myRole === 'admin');
  const isOwner = board && String(board.owner?._id || board.owner) === String(user._id);

  const deleteBoard = async () => {
    if (!confirm(`Delete “${board.name}” and all its tasks? This cannot be undone.`)) return;
    try {
      await api.delete(`/boards/${id}`);
      toast.success('Board deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <FullPageLoader label="Opening board…" />;
  if (!board) return null;

  const done = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Navbar />

      {/* Board header */}
      <div className="border-b border-line bg-surface/60 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-4 py-3.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-content">
                <ArrowLeft size={17} />
              </Link>
              <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: board.color }} />
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 truncate text-lg font-bold tracking-tight text-content">
                  {board.name}
                  <span className={`chip ${myRole === 'admin' ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-muted'}`}>{myRole}</span>
                </h1>
                {board.description && <p className="truncate text-xs text-muted">{board.description}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Live viewers */}
              {presence.length > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="hidden items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-2.5 pr-1 sm:flex">
                  <Eye size={13} className="text-emerald-500" />
                  <span className="text-[11px] font-medium text-muted">{presence.length} viewing</span>
                  <AvatarStack users={presence.map((p) => ({ _id: p.id, name: p.name, avatarColor: p.avatarColor }))} max={3} size="xs" />
                </motion.div>
              )}

              <button onClick={() => setShowMembers(true)} className="btn-outline py-2">
                <Users size={16} />
                <span className="hidden sm:inline">Members</span>
                <span className="rounded-full bg-surface-3 px-1.5 text-xs font-semibold text-muted">{board.members.length}</span>
              </button>

              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenu((m) => !m)} className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-content">
                  <MoreHorizontal size={18} />
                </button>
                {menu && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card absolute right-0 z-40 mt-2 w-48 overflow-hidden shadow-pop">
                    {myRole === 'admin' && (
                      <button onClick={() => { setMenu(false); setShowSettings(true); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content transition-colors hover:bg-surface-2">
                        <Settings2 size={16} className="text-muted" /> Board settings
                      </button>
                    )}
                    <button onClick={() => { setMenu(false); setShowMembers(true); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content transition-colors hover:bg-surface-2">
                      <Users size={16} className="text-muted" /> Members & access
                    </button>
                    {isOwner && (
                      <button onClick={() => { setMenu(false); deleteBoard(); }} className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10">
                        <Trash2 size={16} /> Delete board
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: board.color }} initial={{ width: 0 }} animate={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} transition={{ duration: 0.6 }} />
            </div>
            <span className="text-xs font-medium text-muted">{done}/{tasks.length} done</span>
          </div>
        </div>
      </div>

      {/* Main: board + activity */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-5 overflow-hidden px-4 py-5 sm:px-6">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <KanbanBoard
            columns={board.columns}
            tasks={tasks}
            onMove={handleMove}
            onAddTask={(status) => setCreateStatus(status)}
            onOpenTask={(task) => setOpenTaskId(task._id)}
            onDragStartTask={handleDragStart}
            draggingMap={draggingMap}
          />
        </div>

        <aside className="hidden w-80 shrink-0 lg:block">
          <ActivityFeed activity={activity} />
        </aside>
      </div>

      {/* Modals */}
      {openTask && (
        <TaskModal task={openTask} members={members} canManage={canManageTask(openTask)} onClose={() => setOpenTaskId(null)} />
      )}
      {createStatus && (
        <CreateTaskModal boardId={id} status={createStatus} columns={board.columns} members={members} onClose={() => setCreateStatus(null)} />
      )}
      {showMembers && <MembersModal board={board} myRole={myRole} meId={user._id} onClose={() => setShowMembers(false)} />}
      {showSettings && <BoardSettingsModal board={board} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
