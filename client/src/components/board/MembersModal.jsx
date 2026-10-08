import { useState } from 'react';
import { Copy, Check, UserPlus, Shield, ShieldCheck, Crown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import api from '../../lib/api';

export default function MembersModal({ board, myRole, meId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const isAdmin = myRole === 'admin';
  const ownerId = board.owner?._id || board.owner;

  const copyCode = () => {
    navigator.clipboard.writeText(board.inviteCode);
    setCopied(true);
    toast.success('Invite code copied');
    setTimeout(() => setCopied(false), 1600);
  };

  const addMember = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/boards/${board._id}/members`, { email, role });
      setEmail('');
      toast.success('Member added');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await api.patch(`/boards/${board._id}/members/${userId}`, { role: newRole });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the board?')) return;
    try {
      await api.delete(`/boards/${board._id}/members/${userId}`);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open onClose={onClose} title="Board members & access" maxWidth="max-w-lg">
      {/* Invite code */}
      <div className="mb-5 rounded-xl border border-line bg-surface-2 p-4">
        <p className="label mb-2">Invite code</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm tracking-widest text-content">
            {board.inviteCode}
          </code>
          <button onClick={copyCode} className="btn-outline shrink-0 px-3 py-2">
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Share this code so teammates can join instantly.</p>
      </div>

      {/* Add member (admins only) */}
      {isAdmin && (
        <form onSubmit={addMember} className="mb-5">
          <p className="label mb-2">Add a member by email</p>
          <div className="flex gap-2">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" className="input" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input w-32 shrink-0">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={busy || !email} className="btn-primary shrink-0 px-3">
              {busy ? <Spinner size={16} /> : <UserPlus size={16} />}
            </button>
          </div>
        </form>
      )}

      {/* Member list */}
      <p className="label mb-2">{board.members.length} members</p>
      <div className="space-y-1.5">
        {board.members.map((m) => {
          const u = m.user;
          const isOwner = String(u._id) === String(ownerId);
          return (
            <div key={u._id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2.5">
              <Avatar user={u} size="md" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-content">
                  {u.name}
                  {String(u._id) === String(meId) && <span className="text-[11px] font-normal text-faint">(you)</span>}
                </p>
                <p className="truncate text-xs text-muted">{u.email}</p>
              </div>

              {isOwner ? (
                <span className="chip bg-accent-soft text-accent"><Crown size={12} /> Owner</span>
              ) : isAdmin ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="rounded-md border border-line bg-surface-2 px-2 py-1 text-xs font-medium text-content"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => removeMember(u._id)} className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-danger/10 hover:text-danger">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <span className={`chip ${m.role === 'admin' ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-muted'}`}>
                  {m.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />} {m.role}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
