import { useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';

// Compute a new fractional order so the card lands between its neighbours.
function computeOrder(list, index) {
  const before = list[index - 1];
  const after = list[index];
  if (!before && !after) return 1000;
  if (!before) return after.order - 1000;
  if (!after) return before.order + 1000;
  return (before.order + after.order) / 2;
}

export default function KanbanBoard({ columns, tasks, onMove, onAddTask, onOpenTask, onDragStartTask, draggingMap }) {
  // Group tasks by column key, each sorted by order.
  const grouped = useMemo(() => {
    const map = {};
    columns.forEach((c) => (map[c.key] = []));
    tasks.forEach((t) => {
      (map[t.status] ||= []).push(t);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.order - b.order));
    return map;
  }, [columns, tasks]);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Destination list without the dragged card, to compute the target order.
    const destList = (grouped[destination.droppableId] || []).filter((t) => String(t._id) !== draggableId);
    const order = computeOrder(destList, destination.index);
    onMove(draggableId, destination.droppableId, order);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={(s) => onDragStartTask?.(s.draggableId)}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Column
            key={col.key}
            column={col}
            tasks={grouped[col.key] || []}
            onAddTask={onAddTask}
            onOpenTask={onOpenTask}
            draggingMap={draggingMap}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
