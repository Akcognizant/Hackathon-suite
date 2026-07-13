// src/components/activities/dndKit.jsx
//
// Shared @dnd-kit wiring used by every activity:
//   - sensors for mouse, touch, AND keyboard (Spacebar/Arrows),
//   - screen-reader instructions + live drag announcements,
//   - the animated, "physical" DragOverlay card (lift haptics).
//
// A11y note: the announcements describe ONLY what the candidate did — which item moved,
// to which zone / position. They never reference correctness. This keeps the frontend a
// "dumb terminal": it narrates actions, the backend judges them.

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/** Read aloud when a draggable receives keyboard focus. */
export const screenReaderInstructions = {
  draggable: `
    To pick up an item, press Space or Enter while it is focused.
    While dragging, use the arrow keys to move it.
    Press Space or Enter again to drop it in its new position, or press Escape to cancel.
  `,
};

/**
 * Mouse + touch + keyboard sensors. Pass { sortable: true } for list reordering so the
 * keyboard sensor uses sortable coordinates.
 */
export function useDndSensors({ sortable = false } = {}) {
  return useSensors(
    // Small distance so a drag "grabs" almost immediately on desktop, but still
    // distinguishes a click from a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(
      KeyboardSensor,
      sortable ? { coordinateGetter: sortableKeyboardCoordinates } : undefined,
    ),
  );
}

/**
 * Live announcements for mapping activities (categorize / match).
 * @param {{ getItemLabel: (id: string) => string, getZoneLabel: (id: string) => string }} d
 */
export function useMappingAnnouncements({ getItemLabel, getZoneLabel }) {
  return useMemo(
    () => ({
      onDragStart: ({ active }) => `Picked up ${getItemLabel(active.id)}.`,
      onDragOver: ({ active, over }) =>
        over
          ? `${getItemLabel(active.id)} is over ${getZoneLabel(over.id)}.`
          : `${getItemLabel(active.id)} is no longer over a drop zone.`,
      onDragEnd: ({ active, over }) =>
        over
          ? `Placed ${getItemLabel(active.id)} into ${getZoneLabel(over.id)}.`
          : `${getItemLabel(active.id)} was returned to its previous position.`,
      onDragCancel: ({ active }) => `Cancelled. ${getItemLabel(active.id)} was not moved.`,
    }),
    [getItemLabel, getZoneLabel],
  );
}

/**
 * Live announcements for ordering activities (sequence / rank).
 * @param {{
 *   getItemLabel: (id: string) => string,
 *   getPosition: (id: string) => number,
 *   total: number,
 *   noun?: string,
 * }} d
 */
export function useOrderingAnnouncements({ getItemLabel, getPosition, total, noun = 'position' }) {
  return useMemo(
    () => ({
      onDragStart: ({ active }) =>
        `Picked up ${getItemLabel(active.id)}. Currently ${noun} ${getPosition(active.id)} of ${total}.`,
      onDragOver: ({ active, over }) =>
        over ? `${getItemLabel(active.id)} would move to ${noun} ${getPosition(over.id)} of ${total}.` : '',
      onDragEnd: ({ active, over }) =>
        over
          ? `${getItemLabel(active.id)} dropped at ${noun} ${getPosition(over.id)} of ${total}.`
          : `${getItemLabel(active.id)} stayed at ${noun} ${getPosition(active.id)} of ${total}.`,
      onDragCancel: ({ active }) => `Cancelled. ${getItemLabel(active.id)} was not moved.`,
    }),
    [getItemLabel, getPosition, total, noun],
  );
}

/**
 * Wraps the content shown inside <DragOverlay> and gives it a physical "lifted" feel:
 * a spring scale-up (1.05), a slight 2° rotation, and a sharp drop-shadow. Respects the
 * user's reduced-motion preference.
 */
export function DragOverlayCard({ children }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { scale: 1, rotate: 0 }}
      animate={reduceMotion ? {} : { scale: 1.04, rotate: 1.5 }}
      transition={{ type: 'spring', stiffness: 600, damping: 32, mass: 0.5 }}
      style={{
        transformOrigin: 'center',
        cursor: 'grabbing',
        // Sharp lift shadow that hugs the card shape.
        filter: 'drop-shadow(0 14px 22px rgba(15, 23, 42, 0.28))',
      }}
    >
      {children}
    </motion.div>
  );
}

DragOverlayCard.propTypes = {
  children: PropTypes.node,
};
