// src/components/activities/SequenceActivity.jsx  (the Sequencing layout)
//
// Reorder a vertical list into the correct order (first -> last) using @dnd-kit/sortable.
// Answer = { kind:'order', order:[itemId, ...] }.
//
// ARCHITECTURE CONSTRAINT — collects ONLY the candidate's ordering and forwards raw
// telemetry to the runner. No answer key, no correctness, no scoring lives here. Screen
// reader announcements describe positions ("moved to position 3 of 5"), never rightness.

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import {
  DragOverlayCard,
  screenReaderInstructions,
  useDndSensors,
  useOrderingAnnouncements,
} from './dndKit';

/** The visual for a single ordered row (reused by the live row and the drag overlay). */
function RowBody({ index, label, dragging = false }) {
  return (
    <div
      className={`dnd-draggable flex touch-none select-none items-center gap-2.5 rounded-lg border bg-white px-2.5 py-1.5 ${
        dragging ? 'border-[#AFA9EC] ring-2 ring-[#CECBF6]' : 'border-slate-200 shadow-sm hover:border-[#AFA9EC]'
      }`}
    >
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#534AB7] text-xs font-bold text-white">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-slate-800 sm:text-sm">{label}</span>
      <GripVertical aria-hidden className="h-4 w-4 flex-none text-slate-300" />
    </div>
  );
}

RowBody.propTypes = {
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  dragging: PropTypes.bool,
};

/** A keyboard- and pointer-sortable row. */
function SortableRow({ id, index, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <div {...attributes} {...listeners} aria-label={`${label}. Currently position ${index + 1}.`}>
        <RowBody index={index} label={label} />
      </div>
    </li>
  );
}

SortableRow.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};

const SequenceActivity = forwardRef(function SequenceActivity(
  { activity, initialAnswer, onProgress, onDragAttempt, onEvent },
  ref,
) {
  const [order, setOrder] = useState(() => {
    const ids = activity.items.map((i) => i.id);
    const saved = initialAnswer?.order;
    return saved && saved.length === ids.length && ids.every((id) => saved.includes(id))
      ? saved.slice()
      : ids;
  });
  const [activeId, setActiveId] = useState(null);

  const itemsById = useMemo(
    () => Object.fromEntries(activity.items.map((i) => [i.id, i])),
    [activity.items],
  );

  const sensors = useDndSensors({ sortable: true });
  const getItemLabel = useCallback((id) => itemsById[id]?.label ?? 'item', [itemsById]);
  const getPosition = useCallback((id) => order.indexOf(id) + 1, [order]);
  const announcements = useOrderingAnnouncements({
    getItemLabel,
    getPosition,
    total: order.length,
    noun: 'position',
  });

  // Ordering activities always have every item present, so they are always "complete".
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });
  useEffect(() => {
    onProgressRef.current?.({ isComplete: true, placed: order.length, total: order.length });
  }, [order.length]);

  useImperativeHandle(
    ref,
    () => ({
      isComplete: () => true,
      getAnswer: () => ({ kind: 'order', order }),
    }),
    [order],
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setOrder((o) => arrayMove(o, oldIndex, newIndex));
    onDragAttempt?.();
    onEvent?.({ type: 'reorder', itemId: active.id, toIndex: newIndex });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto mb-1.5 flex w-full max-w-2xl items-center justify-center gap-1.5 rounded-md bg-[#EEEDFE] py-1 text-[11px] font-bold uppercase tracking-wide text-[#3C3489]">
        <span aria-hidden>▲</span>
        <span>Top = first step</span>
      </div>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          {order.map((id, index) => (
            <SortableRow key={id} id={id} index={index} label={itemsById[id]?.label ?? ''} />
          ))}
        </ol>
      </SortableContext>
      <div className="mx-auto mt-1.5 flex w-full max-w-2xl items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span aria-hidden>▼</span>
        <span>Bottom = last step</span>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <DragOverlayCard>
            <RowBody index={order.indexOf(activeId)} label={getItemLabel(activeId)} dragging />
          </DragOverlayCard>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
});

SequenceActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  onProgress: PropTypes.func,
  onDragAttempt: PropTypes.func,
  onEvent: PropTypes.func,
};

export default SequenceActivity;
