import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import api from '../../lib/api';

const COLORS = ['#5b57d1', '#0ea5b7', '#2f9e6b', '#b0842f', '#c2632c', '#8b5cf6', '#c0435a', '#4b6bde'];

export default function BoardSettingsModal({ board, onClose }) {
  const [form, setForm] = useState({ name: board.name, description: board.description || '', color: board.color });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await api.put(`/boards/${board._id}`, form);
      toast.success('Board updated');
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
      title="Board settings"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={busy || !form.name.trim()} className="btn-primary">
            {busy ? <Spinner size={15} /> : 'Save changes'}
          </button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label mb-1.5 block">Board name</label>
          <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label mb-1.5 block">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input resize-none" />
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
  );
}
