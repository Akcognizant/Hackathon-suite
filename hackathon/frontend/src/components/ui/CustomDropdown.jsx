// Fully custom, accessible dropdown for the admin design system. Unlike a native
// <select>, the trigger and menu are real DOM we style ourselves, so it matches the
// DataTable / Button look exactly. Implements the WAI-ARIA button + listbox pattern:
//
//   - Trigger: <button aria-haspopup="listbox" aria-expanded> with a chevron that
//     flips on open/close. Surface matches the secondary Button (rounded-xl, border,
//     shadow-sm, white bg, hover:bg-slate-50) so it reads as part of the system.
//   - Menu: role="listbox"; options role="option" with aria-selected. The active
//     option is tracked via aria-activedescendant while DOM focus stays on the list.
//   - Keyboard: Enter/Space/↑/↓ open; ↑/↓/Home/End move; Enter/Space select;
//     Esc closes (returns focus to trigger); Tab closes; type-ahead jumps by label.
//   - Closes on outside click.
//
// Props:
//   options    [{ value, label }]
//   value      currently selected value
//   onChange   (nextValue) => void
//   label?     optional visible label rendered before the control
//   ariaLabel? accessible name used when no visible label is provided
//   className? extra classes on the control wrapper (typically width, e.g. 'sm:w-44')
//   id?        optional base id (else auto-generated)
//   disabled?  boolean

import { useEffect, useId, useRef, useState } from 'react'

const TRIGGER =
  'inline-flex h-10 w-full items-center justify-between rounded-xl border border-slate-300 ' +
  'bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all ' +
  'hover:border-slate-400 hover:bg-slate-50 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

function ChevronIcon({ open }) {
  return (
    <svg
      className={`pointer-events-none ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
        open ? 'rotate-180' : ''
      }`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="ml-2 h-4 w-4 shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CustomDropdown({
  options = [],
  value,
  onChange,
  label,
  ariaLabel,
  className = 'w-full',
  id,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)
  const optionRefs = useRef([])
  const typeahead = useRef({ buffer: '', timer: 0 })
  const reactId = useId()
  const baseId = id || `dropdown-${reactId}`
  const labelId = `${baseId}-label`

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : options[0]?.label ?? 'Select…'

  // Close when clicking anywhere outside the control.
  useEffect(() => {
    if (!open) return undefined
    const onDocMouseDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  // On open: highlight the current selection and move focus into the list.
  useEffect(() => {
    if (!open) return undefined
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0) // eslint-disable-line react-hooks/set-state-in-effect
    const raf = requestAnimationFrame(() => listRef.current?.focus())
    return () => cancelAnimationFrame(raf)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the active option scrolled into view during keyboard navigation.
  useEffect(() => {
    if (open && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, activeIndex])

  const selectIndex = (index) => {
    const option = options[index]
    if (option) onChange?.(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onTriggerKeyDown = (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      if (!disabled) setOpen(true)
    }
  }

  const onListKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((i) => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (activeIndex >= 0) selectIndex(activeIndex)
        break
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        // Type-ahead: accumulate typed characters and jump to the first match.
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const state = typeahead.current
          state.buffer += event.key.toLowerCase()
          window.clearTimeout(state.timer)
          state.timer = window.setTimeout(() => {
            state.buffer = ''
          }, 500)
          const match = options.findIndex((option) =>
            option.label.toLowerCase().startsWith(state.buffer),
          )
          if (match >= 0) setActiveIndex(match)
        }
        break
    }
  }

  const control = (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : !disabled && setOpen(true))}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${labelId} ${baseId}` : undefined}
        aria-label={label ? undefined : ariaLabel}
        className={TRIGGER}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={label ? labelId : undefined}
          aria-activedescendant={activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined}
          onKeyDown={onListKeyDown}
          className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg focus:outline-none"
        >
          {options.map((option, index) => {
            const isActive = index === activeIndex
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                id={`${baseId}-opt-${index}`}
                ref={(el) => {
                  optionRefs.current[index] = el
                }}
                role="option"
                aria-selected={isSelected}
                onClick={() => selectIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-slate-50' : ''
                } ${isSelected ? 'font-semibold text-blue-700' : 'text-slate-700'}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <CheckIcon />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  if (label) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span id={labelId} className="whitespace-nowrap">
          {label}
        </span>
        {control}
      </div>
    )
  }

  return control
}

export default CustomDropdown
