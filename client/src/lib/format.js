import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns';

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function dueLabel(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return { text: 'Due today', tone: 'warn' };
  if (isTomorrow(d)) return { text: 'Due tomorrow', tone: 'normal' };
  if (isPast(d)) return { text: `Overdue · ${format(d, 'MMM d')}`, tone: 'danger' };
  return { text: format(d, 'MMM d'), tone: 'normal' };
}

export const PRIORITIES = {
  low: { label: 'Low', color: 'var(--prio-low)' },
  medium: { label: 'Medium', color: 'var(--prio-medium)' },
  high: { label: 'High', color: 'var(--prio-high)' },
  urgent: { label: 'Urgent', color: 'var(--prio-urgent)' },
};

// Human sentence for each activity feed entry.
export function activityText(a) {
  const who = a.actor?.name || 'Someone';
  const m = a.meta || {};
  switch (a.type) {
    case 'board_created':
      return `${who} created this board`;
    case 'task_created':
      return `${who} created “${m.title}”`;
    case 'task_moved':
      return `${who} moved “${m.title}” to ${m.toTitle || m.to}`;
    case 'task_updated':
      return `${who} updated “${m.title}”`;
    case 'task_deleted':
      return `${who} deleted “${m.title}”`;
    case 'task_assigned':
      return `${who} assigned “${m.title}”${m.assignee ? ` to ${m.assignee}` : ''}`;
    case 'comment_added':
      return `${who} commented on “${m.title}”`;
    case 'member_joined':
      return `${who} joined the board`;
    case 'member_added':
      return `${who} was added to the board`;
    default:
      return `${who} did something`;
  }
}
