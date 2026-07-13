// src/components/DraggableItem.jsx
import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * A finger-sized, draggable card used by the mapping activities (categorize/match).
 * Sortable activities use their own sortable rows instead.
 *
 * @param {{
 *   id: string,
 *   label: string,
 *   badge?: React.ReactNode,
 *   disabled?: boolean,
 * }} props
 */
export default function DraggableItem({ id, label, badge, disabled = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled });

  const style = {
    transform: CSS.Translate.toString(transform),
    // Hide the original while its drag overlay is shown, to avoid a doubled card.
    opacity: isDragging ? 0 : 1,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className={`dnd-draggable flex w-full touch-none select-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left text-[11px] font-medium leading-tight text-slate-800 shadow-sm transition active:cursor-grabbing sm:text-[13px] sm:leading-snug ${
        disabled ? 'cursor-default opacity-60' : 'cursor-grab hover:border-[#AFA9EC] hover:shadow'
      }`}
      aria-label={`Draggable: ${label}`}
      {...listeners}
      {...attributes}
    >
      {badge != null ? (
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#3C3489]">
          {badge}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

DraggableItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  badge: PropTypes.node,
  disabled: PropTypes.bool,
};

/**
 * Static rendering of a card for use inside <DragOverlay>. No dnd hooks — it just
 * mirrors the look of DraggableItem while floating under the pointer/finger.
 */
export function DragItemPreview({ label, badge }) {
  return (
    <div className="flex w-full cursor-grabbing select-none items-center gap-2 rounded-lg border border-[#AFA9EC] bg-white px-2.5 py-2 text-left text-xs font-semibold leading-snug text-slate-900 shadow-lg ring-2 ring-[#CECBF6] sm:text-sm">
      {badge != null ? (
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#3C3489]">
          {badge}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">{label}</span>
    </div>
  );
}

DragItemPreview.propTypes = {
  label: PropTypes.string.isRequired,
  badge: PropTypes.node,
};
