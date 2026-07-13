// src/components/activities/CategorizeActivity.jsx  (the Categorization layout)
//
// Drag each item from the "unsorted" tray into one of several labeled buckets. Multiple
// items per bucket allowed. Answer = { kind:'mapping', placements: { itemId: zoneId } }.
//
// ARCHITECTURE CONSTRAINT — this component collects ONLY the candidate's arrangement and
// forwards raw telemetry signals (drag attempts + events) to the runner's telemetry hook.
// It has no answer key and computes no correctness, accuracy, or score. The pulsing
// drop-zone feedback reacts to *hover*, never to whether a placement is right.

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import DraggableItem, { DragItemPreview } from '../DraggableItem';
import DropZone from '../DropZone';
import {
  DragOverlayCard,
  screenReaderInstructions,
  useDndSensors,
  useMappingAnnouncements,
} from './dndKit';

const TRAY = '__tray__';

const CategorizeActivity = forwardRef(function CategorizeActivity(
  { activity, initialAnswer, onProgress, onDragAttempt, onEvent },
  ref,
) {
  // placements: itemId -> zoneId (or TRAY while unsorted). Restores from a saved answer.
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
  const getItemLabel = useCallback((id) => itemsById[id]?.label ?? 'item', [itemsById]);
  const getZoneLabel = useCallback(
    (id) => (id === TRAY ? 'Unsorted tasks' : zonesById[id]?.label ?? 'a bucket'),
    [zonesById],
  );
  const announcements = useMappingAnnouncements({ getItemLabel, getZoneLabel });

  const placedCount = activity.items.filter((i) => placements[i.id] !== TRAY).length;
  const total = activity.items.length;
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

    const itemId = active.id;
    const newZone = over.id;
    const prevZone = placements[itemId];
    if (prevZone === newZone) return;

    setPlacements((p) => ({ ...p, [itemId]: newZone }));
    onDragAttempt?.();

    let type;
    if (newZone === TRAY) type = 'remove';
    else if (prevZone === TRAY) type = 'place';
    else type = 'move';

    onEvent?.({ type, itemId, zoneId: newZone === TRAY ? prevZone : newZone });
  }

  const trayItems = activity.items.filter((i) => placements[i.id] === TRAY);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      {/* The unsorted tray wraps its items into a compact multi-column grid so all tasks
          stay short and the buckets below remain in view without scrolling. */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <DropZone
          id={TRAY}
          label="Unsorted tasks"
          count={trayItems.length}
          emptyHint="All tasks sorted — nice!"
          contentClassName="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4"
        >
          {trayItems.map((item) => (
            <DraggableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </DropZone>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {activity.zones.map((zone) => {
            const zoneItems = activity.items.filter((i) => placements[i.id] === zone.id);
            return (
              <DropZone
                key={zone.id}
                id={zone.id}
                label={zone.label}
                count={zoneItems.length}
                emptyHint="Drop tasks here"
              >
                {zoneItems.map((item) => (
                  <DraggableItem key={item.id} id={item.id} label={item.label} />
                ))}
              </DropZone>
            );
          })}
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

CategorizeActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  onProgress: PropTypes.func,
  onDragAttempt: PropTypes.func,
  onEvent: PropTypes.func,
};

export default CategorizeActivity;
