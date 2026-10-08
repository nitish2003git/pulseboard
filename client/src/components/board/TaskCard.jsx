import { Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { MessageSquare, Calendar, GripVertical } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { PRIORITIES, dueLabel } from '../../lib/format';

export default function TaskCard({ task, index, onClick, draggingBy }) {
  const prio = PRIORITIES[task.priority] || PRIORITIES.medium;
  const due = dueLabel(task.dueDate);

  return (
    <Draggable draggableId={String(task._id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          onClick={() => !snapshot.isDragging && onClick(task)}
        >
          <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative cursor-pointer rounded-xl border bg-surface p-3.5 transition-shadow ${
              snapshot.isDragging ? 'border-accent shadow-pop rotate-[1.5deg]' : 'border-line shadow-card hover:shadow-pop hover:border-accent/40'
            }`}
          >
            {/* Priority accent bar */}
            <span className="absolute left-0 top-3.5 h-[calc(100%-1.75rem)] w-1 rounded-full" style={{ backgroundColor: prio.color }} />

            {draggingBy && (
              <span className="absolute -top-2 right-2 chip animate-pulse bg-accent text-white shadow-card">
                {draggingBy} is moving…
              </span>
            )}

            <div className="pl-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-semibold leading-snug text-content">{task.title}</p>
                <GripVertical size={15} className="mt-0.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {task.labels?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {task.labels.slice(0, 3).map((l) => (
                    <span key={l} className="chip bg-surface-3 text-muted">{l}</span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-faint">
                  <span className="chip gap-1 px-1.5" style={{ color: prio.color, backgroundColor: 'var(--surface-3)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: prio.color }} />
                    {prio.label}
                  </span>
                  {task.commentCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      <MessageSquare size={12} /> {task.commentCount}
                    </span>
                  )}
                  {due && (
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: due.tone === 'danger' ? 'var(--prio-urgent)' : due.tone === 'warn' ? 'var(--prio-medium)' : 'var(--text-muted)' }}
                    >
                      <Calendar size={12} /> {due.text}
                    </span>
                  )}
                </div>
                {task.assignee && <Avatar user={task.assignee} size="xs" />}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}
