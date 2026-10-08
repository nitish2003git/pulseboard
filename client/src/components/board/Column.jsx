import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

// Muted dot color per default column so headers read at a glance.
const DOT = {
  todo: 'var(--prio-low)',
  in_progress: 'var(--accent)',
  review: 'var(--prio-medium)',
  done: 'var(--prio-medium)',
};

export default function Column({ column, tasks, onAddTask, onOpenTask, draggingMap }) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DOT[column.key] || 'var(--prio-low)' }} />
          <h3 className="text-sm font-semibold text-content">{column.title}</h3>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-muted">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(column.key)}
          className="grid h-6 w-6 place-items-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-accent"
          title="Add task"
        >
          <Plus size={16} />
        </button>
      </div>

      <Droppable droppableId={column.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-2xl border p-2.5 transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'border-accent/50 bg-accent-soft' : 'border-line/60 bg-surface-2/50'
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onClick={onOpenTask}
                draggingBy={draggingMap?.[task._id]}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <button
                onClick={() => onAddTask(column.key)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line py-8 text-xs text-faint transition-colors hover:border-accent hover:text-accent"
              >
                <Plus size={16} /> Add a task
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
