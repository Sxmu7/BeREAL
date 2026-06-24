// ─── CategoryPicker ───────────────────────────────────────────────────────────
// Drop into src/components/CategoryPicker.tsx
//
// Usage in your CreateGame screen:
//   import CategoryPicker from './components/CategoryPicker'
//
//   const [selectedCategories, setSelectedCategories] = useState<DareCategory[]>(
//     ['harmlos', 'party']
//   )
//
//   <CategoryPicker
//     selected={selectedCategories}
//     onChange={setSelectedCategories}
//   />

import { useState } from 'react';
import { ALL_CATEGORIES, CATEGORY_META, DareCategory, getDaresByCategory } from '../data/dares';

interface CategoryPickerProps {
  selected: DareCategory[];
  onChange: (categories: DareCategory[]) => void;
  /** Minimum 1 category must stay selected */
  minSelected?: number;
}

export default function CategoryPicker({
  selected,
  onChange,
  minSelected = 1,
}: CategoryPickerProps) {
  const [showInfo, setShowInfo] = useState<DareCategory | null>(null);

  function toggle(cat: DareCategory) {
    if (selected.includes(cat)) {
      if (selected.length <= minSelected) return; // enforce minimum
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  }

  const totalDares = ALL_CATEGORIES.filter((c) => selected.includes(c)).reduce(
    (sum, c) => sum + getDaresByCategory(c).length,
    0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span className="eyebrow">Kategorien</span>
        <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--color-text-tertiary)' }}>
          {totalDares} Aufgaben verfügbar
        </span>
      </div>

      {/* Category grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = selected.includes(cat);
          const count = getDaresByCategory(cat).length;
          const isLast = isActive && selected.length <= minSelected;

          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              onLongPress={() => setShowInfo(cat)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '12px 8px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${isActive ? meta.color : 'var(--color-border)'}`,
                background: isActive ? meta.colorDim : 'var(--color-surface)',
                cursor: isLast ? 'not-allowed' : 'pointer',
                opacity: isLast ? 0.5 : 1,
                transition: 'all var(--duration-fast) var(--ease-out-snap)',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
              aria-pressed={isActive}
              aria-label={`${meta.label} ${isActive ? 'ausgewählt' : 'nicht ausgewählt'}`}
            >
              {/* Glow when active */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at 50% 0%, ${meta.colorDim} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Emoji */}
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{meta.emoji}</span>

              {/* Label */}
              <span
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 700,
                  color: isActive ? meta.color : 'var(--color-text-primary)',
                  transition: 'color var(--duration-fast)',
                }}
              >
                {meta.label}
              </span>

              {/* Dare count */}
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: isActive ? meta.color : 'var(--color-text-tertiary)',
                  opacity: 0.8,
                }}
              >
                {count} Dares
              </span>

              {/* Checkmark */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: meta.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path
                      d="M1 3.5L3.5 6L8 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick-select buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onChange([...ALL_CATEGORIES])}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          Alle wählen
        </button>
        <button
          onClick={() => onChange(['harmlos', 'kreativ'])}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          🌱 Familienfreundlich
        </button>
        <button
          onClick={() => onChange(['party', 'cringe', 'brutal'])}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          🔥 Party-Modus
        </button>
      </div>

      {/* Info tooltip */}
      {showInfo && (
        <div
          onClick={() => setShowInfo(null)}
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-elevated)',
            border: `1px solid ${CATEGORY_META[showInfo].color}40`,
            fontSize: 'var(--fs-small)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: CATEGORY_META[showInfo].color }}>
            {CATEGORY_META[showInfo].emoji} {CATEGORY_META[showInfo].label}
          </strong>
          {' — '}
          {CATEGORY_META[showInfo].description}
        </div>
      )}
    </div>
  );
}
