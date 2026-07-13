// src/components/activities/MatchActivity.jsx
//
// A two-column matching exercise: problems on the LEFT, solutions (the `zones`) on the
// RIGHT. The candidate drags a problem rightward onto a solution; matching colored number
// badges on both sides make the connection visible. One-to-one, with auto-eviction.
//
// Answer = { kind:'mapping', placements: { problemId: solutionId } }.
//
// ARCHITECTURE CONSTRAINT — collects ONLY the candidate's pairings and forwards raw
// telemetry. No answer key, correctness, or scoring lives here. The hover pulse on a
// solution slot is purely positional feedback, never a "correct/incorrect" signal.

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  DragOverlayCard,
  screenReaderInstructions,
  useDndSensors,
  useMappingAnnouncements,
} from './dndKit';

// One distinct color per problem (by position), shown on both the problem and the
// solution it is connected to, so the pairing reads as a single colored link.
const PAIR_COLORS = [
  { badge: 'bg-[#534AB7]', card: 'border-[#AFA9EC] bg-[#EEEDFE]/70', ring: 'ring-[#CECBF6]' },
  { badge: 'bg-emerald-600', card: 'border-emerald-300 bg-emerald-50/70', ring: 'ring-emerald-200' },
  { badge: 'bg-amber-500', card: 'border-amber-300 bg-amber-50/70', ring: 'ring-amber-200' },
  { badge: 'bg-rose-600', card: 'border-rose-300 bg-rose-50/70', ring: 'ring-rose-200' },
];

/** Colored number when matched; hollow dot when not. */
function Badge({ color, number }) {
  if (color && number) {
    return (
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white ${color.badge}`}
      >
        {number}
      </span>
    );
  }
  return <span className="h-5 w-5 flex-none rounded-full border-2 border-dashed border-slate-300" />;
}

Badge.propTypes = { color: PropTypes.object, number: PropTypes.number };

/** A draggable problem card in the left column (stays in place; re-draggable). */
function ProblemCard({ id, label, color, number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0 : 1 };
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className={`dnd-draggable flex w-full cursor-grab touch-none select-none items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium leading-tight text-slate-800 shadow-sm transition hover:shadow active:cursor-grabbing sm:text-[13px] sm:leading-snug ${
        color ? color.card : 'border-slate-200 bg-white hover:border-[#AFA9EC]'
      }`}
      aria-label={`Problem: ${label}.${number ? ` Connected to solution ${number}.` : ' Drag onto a solution on the right.'}`}
      {...listeners}
      {...attributes}
    >
      <Badge color={color} number={number} />
      <span className="min-w-0 flex-1">{label}</span>
      <span aria-hidden className="flex-none text-slate-300">
        →
      </span>
    </button>
  );
}

ProblemCard.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.object,
  number: PropTypes.number,
};

/** A droppable solution slot in the right column, with crisp CSS-only hover feedback. */
function SolutionSlot({ id, label, color, number }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[2.5rem] w-full items-center gap-2 rounded-lg border-2 px-2 py-1.5 text-[11px] font-medium leading-tight text-slate-800 transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out will-change-transform sm:text-[13px] sm:leading-snug ${
        isOver
          ? 'scale-[1.01] border-[#534AB7] bg-[#EEEDFE] shadow-[0_0_0_3px_rgba(83,74,183,0.30)]'
          : color
            ? color.card
            : 'border-dashed border-slate-300 bg-slate-50/60'
      }`}
      aria-label={`Solution: ${label}.${number ? ` Connected to problem ${number}.` : ' Drop a problem here.'}`}
    >
      <Badge color={color} number={number} />
      <span className="min-w-0 flex-1">{label}</span>
    </div>
  );
}

SolutionSlot.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.object,
  number: PropTypes.number,
};

const MatchActivity = forwardRef(function MatchActivity(
  { activity, initialAnswer, onProgress, onDragAttempt, onEvent },
  ref,
) {
  // placements: problemId -> solutionId (absent while unmatched). Restores from a saved answer.
  const [placements, setPlacements] = useState(() =>
    initialAnswer?.placements ? { ...initialAnswer.placements } : {},
  );
  const [activeId, setActiveId] = useState(null);

  const itemsById = useMemo(
    () => Object.fromEntries(activity.items.map((i) => [i.id, i])),
    [activity.items],
  );
  const zonesById = useMemo(
    () => Object.fromEntries(activity.zones.map((z) => [z.id, z])),
    [activity.zones],
  );
  const problemIndex = useMemo(
    () => Object.fromEntries(activity.items.map((p, i) => [p.id, i])),
    [activity.items],
  );

  const sensors = useDndSensors();
  const getItemLabel = useCallback((id) => itemsById[id]?.label ?? 'problem', [itemsById]);
  const getZoneLabel = useCallback((id) => zonesById[id]?.label ?? 'a solution', [zonesById]);
  const announcements = useMappingAnnouncements({ getItemLabel, getZoneLabel });

  const placedCount = activity.items.filter((p) => placements[p.id]).length;
  const total = activity.items.length;
  const isComplete = placedCount === total;

  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  });
  useEffect(() => {
    onProgressRef.current?.({ isComplete, placed: placedCount, total });
  }, [isComplete, placedCount, total]);

  useImperativeHandle(
    ref,
    () => ({
      isComplete: () => isComplete,
      getAnswer: () => ({ kind: 'mapping', placements: { ...placements } }),
    }),
    [placements, isComplete],
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return; // dropped outside a solution — keep current state

    const problemId = active.id;
    const solutionId = over.id;
    const prev = placements[problemId];
    if (prev === solutionId) return;

    setPlacements((prevMap) => {
      const next = { ...prevMap };
      // one-to-one: evict whoever currently occupies this solution
      for (const [pid, sid] of Object.entries(next)) {
        if (sid === solutionId && pid !== problemId) delete next[pid];
      }
      next[problemId] = solutionId;
      return next;
    });
    onDragAttempt?.();
    onEvent?.({ type: prev ? 'move' : 'place', itemId: problemId, zoneId: solutionId });
  }

  const problemForSolution = (solutionId) =>
    Object.keys(placements).find((pid) => placements[pid] === solutionId);

  const activeColor =
    activeId != null ? PAIR_COLORS[problemIndex[activeId] % PAIR_COLORS.length] : null;
  const activeNumber = activeId != null ? problemIndex[activeId] + 1 : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <p className="mb-2 text-center text-[11px] font-medium text-slate-400">
        Drag a problem on the left onto its matching solution on the right →
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* LEFT: problems */}
        <div>
          <h3 className="mb-1.5 text-xs font-semibold text-slate-700">Problems</h3>
          <div className="flex flex-col gap-2">
            {activity.items.map((p) => {
              const matched = !!placements[p.id];
              const color = matched ? PAIR_COLORS[problemIndex[p.id] % PAIR_COLORS.length] : null;
              return (
                <ProblemCard
                  key={p.id}
                  id={p.id}
                  label={p.label}
                  color={color}
                  number={matched ? problemIndex[p.id] + 1 : null}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT: solutions (drop targets) */}
        <div>
          <h3 className="mb-1.5 text-xs font-semibold text-slate-700">Solutions</h3>
          <div className="flex flex-col gap-2">
            {activity.zones.map((s) => {
              const pid = problemForSolution(s.id);
              const color = pid ? PAIR_COLORS[problemIndex[pid] % PAIR_COLORS.length] : null;
              return (
                <SolutionSlot
                  key={s.id}
                  id={s.id}
                  label={s.label}
                  color={color}
                  number={pid ? problemIndex[pid] + 1 : null}
                />
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <DragOverlayCard>
            <div
              className={`flex select-none items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-[11px] font-semibold leading-tight text-slate-900 sm:text-[13px] ${
                activeColor ? activeColor.card : 'border-[#AFA9EC]'
              }`}
            >
              <Badge color={activeColor} number={activeNumber} />
              <span>{getItemLabel(activeId)}</span>
            </div>
          </DragOverlayCard>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
});

MatchActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  onProgress: PropTypes.func,
  onDragAttempt: PropTypes.func,
  onEvent: PropTypes.func,
};

export default MatchActivity;
