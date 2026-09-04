/**
 * The football. It appears twice and only twice: under the desk in Act 0,
 * dusty and desaturated, and on the desk in Act 8, lit. That move is the whole
 * argument of the film, so it is a real drawn object rather than a CSS
 * approximation.
 */
export default function Football({
  state,
  className = '',
}: {
  state: 'under-desk' | 'on-desk';
  className?: string;
}) {
  return (
    <span
      className={`football football--${state} ${className}`.trim()}
      data-football={state}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" role="presentation" focusable="false">
        <defs>
          <radialGradient id="ballLight" cx="36%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="52%" stopColor="#dcdcd6" />
            <stop offset="100%" stopColor="#8a8a82" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#ballLight)" />

        {/* Centre pentagon */}
        <polygon
          points="50,26 66,38 60,57 40,57 34,38"
          fill="#191919"
        />

        {/* The five that ring it, cropped by the ball's edge */}
        <g fill="#191919" opacity="0.92">
          <polygon points="50,10 60,2 40,2" />
          <polygon points="72,42 88,34 92,50 78,58" />
          <polygon points="62,62 76,72 66,86 52,80" />
          <polygon points="38,62 48,80 34,86 24,72" />
          <polygon points="28,42 22,58 8,50 12,34" />
        </g>

        {/* Seams */}
        <g stroke="#191919" strokeWidth="2.4" fill="none" opacity="0.55">
          <path d="M50 26 L50 10" />
          <path d="M66 38 L78 30" />
          <path d="M60 57 L70 68" />
          <path d="M40 57 L30 68" />
          <path d="M34 38 L22 30" />
        </g>

        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
      </svg>
    </span>
  );
}
