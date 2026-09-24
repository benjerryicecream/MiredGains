// ─── Design Token Palette ─────────────────────────────────────────────────────
// Clean, quiet dark theme. Surfaces define depth (page → card → well),
// borders are hairlines only, and the emerald accent is reserved for
// primary actions, active states and completion.

const C = {
  // Surfaces
  bg:           '#0f1115',   // page background — deep charcoal
  bgCard:       '#171a21',   // cards, sheets, tab bar
  bgElevated:   '#1f232b',   // nested chips, steppers, secondary buttons
  bgInput:      '#1f232b',   // inputs share the elevated surface

  // Hairlines
  border:       '#2a2f3a',   // interactive outlines, chart grid
  borderSubtle: '#22262e',   // dividers, card outlines

  // Accent — emerald, used sparingly
  emerald:      '#34d399',   // text/icons/active tints
  emeraldDim:   '#059669',   // filled buttons & badges
  emeraldBg:    'rgba(52,211,153,0.12)',   // tinted pill/row background

  // Text
  textPrimary:  '#f4f6f8',
  textSecondary:'#9aa3af',
  textMuted:    '#6b7280',

  // Status
  danger:       '#ef4444',
  dangerBg:     'rgba(239,68,68,0.12)',
  warning:      '#f59e0b',

  // Ripple / overlay — neutral, keeps green reserved for meaning
  ripple:       'rgba(255,255,255,0.07)',
  overlay:      'rgba(0,0,0,0.6)',
} as const;

export default C;
