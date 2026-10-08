import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Send, Tag, X, Flag, User as UserIcon, CalendarDays, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { PRIORITIES, timeAgo } from '../../lib/format';

export default function TaskModal({ task, members, canManage, onClose }) {
  const [draft, setDraft] = useState(task);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const bottomRef = useRef(null);

  // Reset the editable draft when a different task is opened.
  // (Live updates to the same task are intentionally not merged so they
  // never clobber a field the user is mid-way through editing.)
  useEffect(() => {
    setDraft(task);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task._id]);

  // Load comments + subscribe to live comments for this task only.
  useEffect(() => {
    let active = true;
    setLoadingComments(true);
    api.get(`/tasks/${task._id}/comments`).then(({ data }) => {
      if (active) {
        setComments(data.comments);
        setLoadingComments(false);
      }
    });

    const socket = getSocket();
    const onComment = ({ comment, taskId }) => {
      if (String(taskId) !== String(task._id)) return;
      setComments((prev) => (prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]));
    };
    socket?.on('comment:added', onComment);
    return () => {
      active = false;
      socket?.off('comment:added', onComment);
    };
  }, [task._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const patch = (fields) => setDraft((d) => ({ ...d, ...fields }));

  const save = async (fields) => {
    setSaving(true);
    try {
      // Convert assignee object -> id for the API.
      const payload = { ...fields };
      if ('assignee' in payload) payload.assignee = payload.assignee?._id || payload.assignee || null;
      await api.put(`/tasks/${task._id}`, payload);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveTitleDesc = () => {
    if (draft.title.trim() && (draft.title !== task.title || draft.description !== task.description)) {
      save({ title: draft.title.trim(), description: draft.description });
    }
  };

  const addLabel = (e) => {
    e.preventDefault();
    const l = labelInput.trim();
    if (!l || draft.labels?.includes(l)) return setLabelInput('');
    const labels = [...(draft.labels || []), l];
    patch({ labels });
    save({ labels });
    setLabelInput('');
  };

  const removeLabel = (l) => {
    const labels = (draft.labels || []).filter((x) => x !== l);
    patch({ labels });
    save({ labels });
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { body: newComment.trim() });
      setComments((prev) => (prev.some((c) => c._id === data.comment._id) ? prev : [...prev, data.comment]));
      setNewComment('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted');
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open onClose={onClose} maxWidth="max-w-2xl" title={null}>
      <div className="-mx-5 -my-4 flex max-h-[80vh] flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <Flag size={18} className="mt-1 shrink-0" style={{ color: PRIORITIES[draft.priority]?.color }} />
          <textarea
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            onBlur={saveTitleDesc}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent p-0 text-lg font-bold text-content outline-none focus:ring-0"
            placeholder="Task title"
          />
          <button onClick={onClose} className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-3 hover:text-content">
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-y-auto sm:grid-cols-[1.4fr_1fr]">
          {/* Left: description + comments */}
          <div className="border-line px-5 py-4 sm:border-r">
            <label className="label mb-2 block">Description</label>
            <textarea
              value={draft.description || ''}
              onChange={(e) => patch({ description: e.target.value })}
              onBlur={saveTitleDesc}
              rows={3}
              placeholder="Add more detail…"
              className="input resize-none text-[13px]"
            />

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <label className="label">Comments</label>
                <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-muted">{comments.length}</span>
              </div>

              <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                {loadingComments ? (
                  <div className="flex justify-center py-4"><Spinner size={18} className="text-accent" /></div>
                ) : comments.length === 0 ? (
                  <p className="py-3 text-center text-xs text-faint">No comments yet — start the conversation.</p>
                ) : (
                  comments.map((c) => (
                    <motion.div key={c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                      <Avatar user={c.author} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-semibold text-content">{c.author?.name}</span>
                          <span className="text-[11px] text-faint">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] text-muted">{c.body}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={postComment} className="mt-3 flex items-center gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="input py-2 text-[13px]"
                />
                <button type="submit" disabled={posting || !newComment.trim()} className="btn-primary shrink-0 px-3 py-2">
                  {posting ? <Spinner size={15} /> : <Send size={15} />}
                </button>
              </form>
            </div>
          </div>

          {/* Right: meta */}
          <div className="space-y-4 bg-surface-2/50 px-5 py-4">
            <Field icon={UserIcon} label="Assignee">
              <select
                value={draft.assignee?._id || draft.assignee || ''}
                onChange={(e) => {
                  const m = members.find((mm) => mm._id === e.target.value);
                  patch({ assignee: m || null });
                  save({ assignee: e.target.value || null });
                }}
                className="input py-2 text-[13px]"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </Field>

            <Field icon={Flag} label="Priority">
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(PRIORITIES).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => { patch({ priority: key }); save({ priority: key }); }}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[12px] font-medium transition-all ${
                      draft.priority === key ? 'border-transparent text-white' : 'border-line text-muted hover:bg-surface-3'
                    }`}
                    style={draft.priority === key ? { backgroundColor: p.color } : {}}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: draft.priority === key ? '#fff' : p.color }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field icon={CalendarDays} label="Due date">
              <input
                type="date"
                value={draft.dueDate ? new Date(draft.dueDate).toISOString().slice(0, 10) : ''}
                onChange={(e) => { patch({ dueDate: e.target.value }); save({ dueDate: e.target.value || null }); }}
                className="input py-2 text-[13px]"
              />
            </Field>

            <Field icon={Tag} label="Labels">
              <div className="flex flex-wrap gap-1.5">
                {(draft.labels || []).map((l) => (
                  <span key={l} className="chip bg-surface-3 text-muted">
                    {l}
                    <button onClick={() => removeLabel(l)} className="hover:text-[var(--prio-urgent)]"><X size={11} /></button>
                  </span>
                ))}
              </div>
              <form onSubmit={addLabel} className="mt-1.5">
                <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)} placeholder="Add label + Enter" className="input py-1.5 text-[12px]" />
              </form>
            </Field>

            <div className="flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-faint">
              <Clock size={12} /> Created {timeAgo(task.createdAt)}
              {saving && <span className="ml-auto flex items-center gap-1 text-accent"><Spinner size={11} /> saving</span>}
            </div>

            {canManage && (
              <button onClick={remove} className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10">
                <Trash2 size={15} /> Delete task
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="label mb-1.5 flex items-center gap-1.5"><Icon size={13} /> {label}</label>
      {children}
    </div>
  );
}
