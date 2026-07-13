// src/components/DropZone.jsx
import PropTypes from 'prop-types';
import { useDroppable } from '@dnd-kit/core';

/**
 * A labeled droppable target (categorize buckets + the "unsorted" tray).
 *
 * While a draggable hovers, the zone highlights with a crisp, GPU-cheap CSS transition
 * (border + background + ring + a hair of scale). We deliberately avoid JS/framer
 * animation loops here so dragging stays smooth — the highlight is pure CSS and the only
 * React change is a className toggle. Reacting to hover is purely visual; it never reveals
 * whether the drop is correct.
 *
 * @param {{
 *   id: string,
 *   label?: string,
 *   count?: number,
 *   children?: React.ReactNode,
 *   emptyHint?: string,
 *   className?: string,
 *   contentClassName?: string,
 * }} props
 */
export default function DropZone({
  id,
  label,
  count,
  children,
  emptyHint,
  className = '',
  contentClassName = 'flex flex-1 flex-col gap-2',
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[2.5rem] flex-col rounded-xl border-2 border-dashed p-1.5 transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out will-change-transform sm:p-2 ${
        isOver
          ? 'scale-[1.01] border-[#534AB7] bg-[#EEEDFE] shadow-[0_0_0_3px_rgba(83,74,183,0.30)]'
          : 'border-slate-300 bg-slate-50/60'
      } ${className}`}
      aria-label={label ? `Drop zone: ${label}` : 'Drop zone'}
    >
      {label ? (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">{label}</span>
          {typeof count === 'number' ? (
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {count}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={contentClassName}>
        {isEmpty && emptyHint ? (
          <p className="col-span-full m-auto text-center text-xs text-slate-400">{emptyHint}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

DropZone.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  count: PropTypes.number,
  children: PropTypes.node,
  emptyHint: PropTypes.string,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
};
