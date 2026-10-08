import { initials } from '../../lib/format';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

export default function Avatar({ user, size = 'md', ring = false, title }) {
  if (!user) return null;
  return (
    <div
      title={title || user.name}
      className={`${SIZES[size]} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white
        ${ring ? 'ring-2 ring-surface' : ''}`}
      style={{ backgroundColor: user.avatarColor || '#6366f1' }}
    >
      {initials(user.name)}
    </div>
  );
}

// Overlapping stack of avatars used on board cards + member lists.
export function AvatarStack({ users = [], max = 4, size = 'sm' }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u, i) => (
        <Avatar key={u._id || i} user={u} size={size} ring />
      ))}
      {extra > 0 && (
        <div
          className={`${SIZES[size]} inline-flex items-center justify-center rounded-full bg-surface-3 font-semibold text-muted ring-2 ring-surface`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
