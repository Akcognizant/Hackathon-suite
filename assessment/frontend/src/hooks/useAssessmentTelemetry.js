// src/hooks/useAssessmentTelemetry.js
//
// Centralizes per-activity behavioral telemetry so UI components can stay focused on
// rendering and interaction.
//
// ARCHITECTURE CONSTRAINT — "dumb terminal":
// This hook records ONLY raw observations: when the clock started, how many drags the
// candidate made, and an ordered event log. It deliberately knows NOTHING about answer
// keys, correctness, accuracy, or scoring. Those are computed exclusively by the
// backend. The frontend just ships these raw signals up.
//
// Design: the source of truth lives in refs (never stale at submit time). We expose
// `startedAt` as a timestamp rather than a live "elapsedMs" so the visible stopwatch can
// tick *inside its own component* — that keeps the per-second clock update from
// re-rendering the drag-and-drop tree.

import { useCallback, useRef, useState } from 'react';

/**
 * @typedef {import('../api/types').ActivityEvent} ActivityEvent
 *
 * @typedef {Object} Telemetry
 * @property {ActivityEvent[]} events       - ordered raw event log
 * @property {number} dragAttempts          - count of completed drags
 * @property {number} timeSpentMs           - ms since the clock started
 */

/**
 * Track time + interaction telemetry for a single activity (or a whole attempt).
 *
 * @param {{ autoStart?: boolean }} [options] - begin the clock on mount (default true)
 * @returns {{
 *   startedAt: number | null,
 *   dragAttempts: number,
 *   start: () => void,
 *   reset: () => void,
 *   recordDragAttempt: () => void,
 *   logEvent: (event: Omit<ActivityEvent, 'timestamp'>) => void,
 *   getTimeSpentMs: () => number,
 *   getTelemetry: () => Telemetry,
 * }}
 */
export default function useAssessmentTelemetry({ autoStart = true } = {}) {
  // Refs are the source of truth (always fresh, never stale at submit time).
  const startRef = useRef(autoStart ? Date.now() : null);
  const dragAttemptsRef = useRef(0);
  const eventsRef = useRef([]);

  // State mirrors drive UI only: `startedAt` lets the Stopwatch self-tick; `dragAttempts`
  // is available if a view wants to show a live "moves" counter.
  const [startedAt, setStartedAt] = useState(startRef.current);
  const [dragAttempts, setDragAttempts] = useState(0);

  /** Start (or restart) the clock. */
  const start = useCallback(() => {
    startRef.current = Date.now();
    setStartedAt(startRef.current);
  }, []);

  /** Clear all telemetry and restart the clock (e.g. when a new activity mounts). */
  const reset = useCallback(() => {
    startRef.current = Date.now();
    dragAttemptsRef.current = 0;
    eventsRef.current = [];
    setStartedAt(startRef.current);
    setDragAttempts(0);
  }, []);

  /** Count one completed drag (place / move / reorder). */
  const recordDragAttempt = useCallback(() => {
    dragAttemptsRef.current += 1;
    setDragAttempts(dragAttemptsRef.current);
  }, []);

  /**
   * Append a raw behavioral event; the caller supplies the shape, we stamp the time.
   * @param {Omit<ActivityEvent, 'timestamp'>} event
   */
  const logEvent = useCallback((event) => {
    eventsRef.current.push({ ...event, timestamp: Date.now() });
  }, []);

  /** Milliseconds since the clock started (0 if never started). */
  const getTimeSpentMs = useCallback(
    () => (startRef.current == null ? 0 : Date.now() - startRef.current),
    [],
  );

  /**
   * Snapshot of everything to send to the backend on submit.
   * @returns {Telemetry}
   */
  const getTelemetry = useCallback(
    () => ({
      events: eventsRef.current,
      dragAttempts: dragAttemptsRef.current,
      timeSpentMs: getTimeSpentMs(),
    }),
    [getTimeSpentMs],
  );

  return {
    startedAt,
    dragAttempts,
    start,
    reset,
    recordDragAttempt,
    logEvent,
    getTimeSpentMs,
    getTelemetry,
  };
}
