// src/components/activities/RankActivity.jsx
//
// The same sortable interaction as Sequence, framed as prioritization (1 = highest).
// Answer = { kind:'order', order:[itemId, ...] }.
//
// ARCHITECTURE CONSTRAINT — collects ONLY the candidate's ordering and forwards raw
// telemetry. No answer key, correctness, or scoring here.

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

/** The visual for a single ranked row (reused by the live row and the drag overlay). */
function RowBody({ index, label, dragging = false }) {
  return (
    <div
      className={`dnd-draggable flex touch-none select-none items-center gap-2.5 rounded-lg border bg-white px-2.5 py-1.5 ${
        dragging ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200 shadow-sm hover:border-amber-300'
      }`}
    >
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
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
function RankRow({ id, index, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <div {...attributes} {...listeners} aria-label={`${label}. Currently priority ${index + 1}.`}>
        <RowBody index={index} label={label} />
      </div>
    </li>
  );
}

RankRow.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};

const RankActivity = forwardRef(function RankActivity(
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
    noun: 'priority',
  });

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
      <div className="mx-auto mb-1.5 flex w-full max-w-2xl items-center justify-center gap-1.5 rounded-md bg-amber-50 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
        <span aria-hidden>▲</span>
        <span>Top = #1 highest priority</span>
      </div>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          {order.map((id, index) => (
            <RankRow key={id} id={id} index={index} label={itemsById[id]?.label ?? ''} />
          ))}
        </ol>
      </SortableContext>
      <div className="mx-auto mt-1.5 flex w-full max-w-2xl items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span aria-hidden>▼</span>
        <span>Bottom = lowest priority</span>
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

RankActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  onProgress: PropTypes.func,
  onDragAttempt: PropTypes.func,
  onEvent: PropTypes.func,
};

export default RankActivity;
