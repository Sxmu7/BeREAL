import './SegmentedControl.css'

/**
 * Schlichte Segment-Auswahl für Settings. Bewusst monochrom: die
 * aktive Option hebt sich nur durch Hintergrund/Text ab, keine Farbe.
 */
export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          className={
            value === opt.value
              ? 'segmented__option segmented__option--active'
              : 'segmented__option'
          }
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
