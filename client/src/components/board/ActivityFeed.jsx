import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ArrowRightLeft, Pencil, Trash2, UserPlus, MessageSquare, Sparkles, Activity as ActivityIcon } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { timeAgo, activityText } from '../../lib/format';

const ICONS = {
  task_created: Plus,
  task_moved: ArrowRightLeft,
  task_updated: Pencil,
  task_deleted: Trash2,
  task_assigned: UserPlus,
  comment_added: MessageSquare,
  member_joined: UserPlus,
  member_added: UserPlus,
  board_created: Sparkles,
};

export default function ActivityFeed({ activity }) {
  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <ActivityIcon size={16} className="text-accent" />
        <h3 className="text-sm font-semibold text-content">Activity</h3>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          live
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {activity.length === 0 ? (
          <div className="px-3 py-10 text-center text-sm text-muted">No activity yet.</div>
        ) : (
          <AnimatePresence initial={false}>
            {activity.map((a) => {
              const Icon = ICONS[a.type] || ActivityIcon;
              return (
                <motion.div
                  key={a._id}
                  layout
                  initial={{ opacity: 0, x: 12, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2"
                >
                  <div className="relative mt-0.5">
                    <Avatar user={a.actor} size="sm" />
                    <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-surface text-accent ring-1 ring-line">
                      <Icon size={9} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-snug text-content">{activityText(a)}</p>
                    <p className="mt-0.5 text-[11px] text-faint">{timeAgo(a.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
