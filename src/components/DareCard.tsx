// ─── DareCard ─────────────────────────────────────────────────────────────────
// Modernisierte Dare-Anzeige mit Kategorie-Farbe + Difficulty-Indikator
//
// Usage:
//   <DareCard dare={currentDare} playerName="Max" playerEmoji="🐻" />

import { Dare, CATEGORY_META } from '../data/dares';

interface DareCardProps {
  dare: Dare;
  playerName: string;
  playerEmoji?: string;
  /** Show punishment hint below */
  punishmentText?: string;
  className?: string;
}

export default function DareCard({
  dare,
  playerName,
  playerEmoji = '👤',
  punishmentText = 'Oder trink!',
  className,
}: DareCardProps) {
  const meta = CATEGORY_META[dare.category];

  const difficultyDots = Array.from({ length: 3 }, (_, i) => i < dare.difficulty);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
        width: '100%',
      }}
    >
      {/* Player + Category badge row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Player */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--gradient-avatar-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            {playerEmoji}
          </div>
          <span
            style={{
              fontSize: 'var(--fs-small)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            {playerName}
          </span>
        </div>

        {/* Category badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 'var(--radius-full)',
            background: meta.colorDim,
            border: `1px solid ${meta.color}40`,
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>{meta.emoji}</span>
          <span
            style={{
              fontSize: 'var(--fs-caption)',
              fontWeight: 700,
              color: meta.color,
            }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Dare Text */}
      <div
        style={{
          width: '100%',
          padding: '28px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface)',
          border: `1px solid ${meta.color}25`,
          boxShadow: `0 0 40px ${meta.color}10, var(--shadow-card)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${meta.color}60, transparent)`,
          }}
        />

        <p
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            margin: 0,
            color: 'var(--color-text-primary)',
          }}
        >
          {dare.text}
        </p>
      </div>

      {/* Difficulty + Punishment */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 4px',
        }}
      >
        {/* Difficulty dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 'var(--fs-caption)',
              color: 'var(--color-text-tertiary)',
              fontWeight: 500,
            }}
          >
            Schwierigkeit
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {difficultyDots.map((filled, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: filled ? meta.color : 'var(--color-border-strong)',
                  transition: 'background var(--duration-fast)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Punishment hint */}
        <span
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic',
          }}
        >
          {punishmentText}
        </span>
      </div>
    </div>
  );
}
