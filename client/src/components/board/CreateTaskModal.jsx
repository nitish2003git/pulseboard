import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import api from '../../lib/api';
import { PRIORITIES } from '../../lib/format';

export default function CreateTaskModal({ boardId, status, columns, members, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', status });
  const [busy, setBusy] = useState(false);
  const columnTitle = columns.find((c) => c.key === status)?.title || 'To Do';

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await api.post(`/boards/${boardId}/tasks`, { ...form, assignee: form.assignee || null });
      toast.success('Task added');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add task to “${columnTitle}”`}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={busy || !form.title.trim()} className="btn-primary">
            {busy ? <Spinner size={15} /> : 'Add task'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label mb-1.5 block">Title</label>
          <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" className="input" />
        </div>
        <div>
          <label className="label mb-1.5 block">Description <span className="font-normal normal-case text-faint">(optional)</span></label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1.5 block">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
              {Object.entries(PRIORITIES).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1.5 block">Assignee</label>
            <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="input">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
