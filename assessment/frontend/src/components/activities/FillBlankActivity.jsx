// src/components/activities/FillBlankActivity.jsx  (Fill-in-the-blank layout)
//
// Drag each word from the tray into a blank inside a sentence. Exactly ONE word per blank;
// dropping a word onto an occupied blank displaces the previous word back to the tray.
// Answer = { kind:'mapping', placements: { wordId: blankId } } — the SAME shape the backend
// already scores for categorize/match, so no ScoringService change is needed.
//
// Each zone (blank) carries, in its `label`, the sentence fragment that PRECEDES it, and
// `activity.suffix` (optional) is static text rendered after the LAST blank. We render those
// fragments interleaved with inline drop targets to reconstruct the sentence.
//
// The word pool (`activity.items`) may be LARGER than the number of blanks (`activity.zones`)
// — the admin can add decoy words with no correct blank. Completeness is therefore judged by
// every BLANK being filled, not every word being placed; leftover decoys may sit in the tray.
//
// ARCHITECTURE CONSTRAINT (shared by all activities): this component only collects the
// candidate's arrangement + forwards raw telemetry. It has no answer key and judges nothing.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { DndContext, DragOverlay, closestCenter, useDroppable } from '@dnd-kit/core';
import DraggableItem, { DragItemPreview } from '../DraggableItem';
import {
  DragOverlayCard,
  screenReaderInstructions,
  useDndSensors,
  useMappingAnnouncements,
} from './dndKit';

const TRAY = '__tray__';

/** An inline blank inside the sentence — a small droppable that holds at most one word. */
function BlankSlot({ id, children, filled }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <span
      ref={setNodeRef}
      className={`mx-1 inline-flex min-h-[2rem] min-w-[6rem] items-center justify-center rounded-lg border-2 border-dashed px-1.5 py-0.5 align-middle transition-[background-color,border-color,box-shadow] duration-150 ${
        isOver
          ? 'border-[#534AB7] bg-[#EEEDFE] shadow-[0_0_0_3px_rgba(83,74,183,0.30)]'
          : filled
            ? 'border-[#CECBF6] bg-white'
            : 'border-slate-300 bg-slate-50/60'
      }`}
    >
      {filled ? children : <span className="text-xs text-slate-400">drop here</span>}
    </span>
  );
}

BlankSlot.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  filled: PropTypes.bool,
};

const FillBlankActivity = forwardRef(function FillBlankActivity(
  { activity, initialAnswer, onProgress, onDragAttempt, onEvent },
  ref,
) {
  // placements: wordId -> blankId (or TRAY while unplaced). Restores from a saved answer.
  const [placements, setPlacements] = useState(() => {
    const base = Object.fromEntries(activity.items.map((item) => [item.id, TRAY]));
    if (initialAnswer?.placements) Object.assign(base, initialAnswer.placements);
    return base;
  });
  const [activeId, setActiveId] = useState(null);

  const itemsById = useMemo(
    () => Object.fromEntries(activity.items.map((i) => [i.id, i])),
    [activity.items],
  );
  const zonesById = useMemo(
    () => Object.fromEntries(activity.zones.map((z) => [z.id, z])),
    [activity.zones],
  );

  const sensors = useDndSensors();
  const getItemLabel = useCallback((id) => itemsById[id]?.label ?? 'word', [itemsById]);
  const getZoneLabel = useCallback(
    (id) => (id === TRAY ? 'the word bank' : `the blank after "${zonesById[id]?.label ?? ''}"`),
    [zonesById],
  );
  const announcements = useMappingAnnouncements({ getItemLabel, getZoneLabel });

  // Completeness = every blank filled (with any word) — not every word placed, since decoy
  // words may legitimately be left unused in the tray.
  const filledZoneIds = new Set(
    Object.values(placements).filter((zoneId) => zoneId !== TRAY),
  );
  const total = activity.zones.length;
  const placedCount = Math.min(filledZoneIds.size, total);
  const isComplete = placedCount === total;

  // Report completeness to the runner without re-subscribing every render.
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
      getAnswer: () => {
        const mapping = {};
        for (const item of activity.items) {
          if (placements[item.id] && placements[item.id] !== TRAY) {
            mapping[item.id] = placements[item.id];
          }
        }
        return { kind: 'mapping', placements: mapping };
      },
    }),
    [activity.items, placements, isComplete],
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const wordId = active.id;
    const target = over.id; // a blankId or TRAY
    const prevZone = placements[wordId];
    if (prevZone === target) return;

    setPlacements((p) => {
      const next = { ...p, [wordId]: target };
      // One word per blank: bump whoever was already in the target blank back to the tray.
      if (target !== TRAY) {
        for (const otherId of Object.keys(next)) {
          if (otherId !== wordId && next[otherId] === target) {
            next[otherId] = TRAY;
          }
        }
      }
      return next;
    });
    onDragAttempt?.();

    let type;
    if (target === TRAY) type = 'remove';
    else if (prevZone === TRAY) type = 'place';
    else type = 'move';
    onEvent?.({ type, itemId: wordId, zoneId: target === TRAY ? prevZone : target });
  }

  const trayItems = activity.items.filter((i) => placements[i.id] === TRAY);
  const trayRef = useDroppable({ id: TRAY });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* The sentence with inline blanks. Each zone label is the fragment before its blank. */}
        <p className="text-sm leading-loose text-slate-800 sm:text-base">
          {activity.zones.map((zone) => {
            const wordId = activity.items.find((i) => placements[i.id] === zone.id)?.id;
            return (
              <span key={zone.id}>
                {zone.label}
                <BlankSlot id={zone.id} filled={Boolean(wordId)}>
                  {wordId ? <DraggableItem id={wordId} label={itemsById[wordId].label} /> : null}
                </BlankSlot>
              </span>
            );
          })}
          <span>{activity.suffix != null ? activity.suffix : '.'}</span>
        </p>

        {/* The word bank (tray). Drop a word back here to unplace it. */}
        <div
          ref={trayRef.setNodeRef}
          aria-label="Word bank"
          className={`rounded-xl border-2 border-dashed p-2 transition-[background-color,border-color,box-shadow] duration-150 ${
            trayRef.isOver
              ? 'border-[#534AB7] bg-[#EEEDFE] shadow-[0_0_0_3px_rgba(83,74,183,0.30)]'
              : 'border-slate-300 bg-slate-50/60'
          }`}
        >
          <div className="mb-1.5 text-xs font-semibold text-slate-700">Words</div>
          {trayItems.length === 0 ? (
            <p className="py-1 text-center text-xs text-slate-400">All words placed — nice!</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {trayItems.map((item) => (
                <DraggableItem key={item.id} id={item.id} label={item.label} />
              ))}
            </div>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <DragOverlayCard>
            <DragItemPreview label={getItemLabel(activeId)} />
          </DragOverlayCard>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
});

FillBlankActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  onProgress: PropTypes.func,
  onDragAttempt: PropTypes.func,
  onEvent: PropTypes.func,
};

export default FillBlankActivity;
