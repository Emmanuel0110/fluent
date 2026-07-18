// Rank medallions for the dashboard. Rendered as inline SVG (not a CSS mask) so
// the gradients and relief that give each rank its identity actually show —
// emerald → sapphire → amethyst → gold, from Beginner to Expert.
// Decorative only: the rank name is already announced by the adjacent label,
// so the badge is hidden from assistive tech to avoid a duplicate reading.

type Rank = "Beginner" | "Amateur" | "Advanced" | "Expert";

const emblems: Record<Rank, JSX.Element> = {
  Beginner: (
    <>
      <defs>
        <linearGradient id="rb-beg-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="52%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <radialGradient id="rb-beg-disc" cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#0c3b2c" />
          <stop offset="100%" stopColor="#04241a" />
        </radialGradient>
        <linearGradient id="rb-beg-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#rb-beg-ring)" />
      <circle cx="60" cy="60" r="44" fill="url(#rb-beg-disc)" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#ffffff" strokeOpacity=".08" strokeWidth="1.5" />
      <path d="M60 84 L60 56" stroke="#065f46" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 66 C60 52 51 44 39 45 C39 58 48 66 60 66 Z" fill="url(#rb-beg-leaf)" />
      <path d="M60 66 C60 50 69 42 82 43 C82 57 72 66 60 66 Z" fill="url(#rb-beg-leaf)" />
      <path d="M60 66 C60 52 51 44 39 45" fill="none" stroke="#ffffff" strokeOpacity=".45" strokeWidth="1.4" />
      <ellipse cx="49" cy="34" rx="20" ry="9" fill="#ffffff" opacity=".14" />
    </>
  ),
  Amateur: (
    <>
      <defs>
        <linearGradient id="rb-ama-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="52%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <radialGradient id="rb-ama-disc" cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#12315f" />
          <stop offset="100%" stopColor="#0a1c3a" />
        </radialGradient>
        <linearGradient id="rb-ama-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#rb-ama-ring)" />
      <circle cx="60" cy="60" r="44" fill="url(#rb-ama-disc)" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#ffffff" strokeOpacity=".08" strokeWidth="1.5" />
      <path d="M60 46 C52 41 44 41 37 43 L37 76 C44 74 52 74 60 79 Z" fill="url(#rb-ama-page)" />
      <path d="M60 46 C68 41 76 41 83 43 L83 76 C76 74 68 74 60 79 Z" fill="url(#rb-ama-page)" />
      <path d="M60 46 L60 79" stroke="#3b82f6" strokeWidth="2" strokeOpacity=".6" />
      <g stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity=".7">
        <path d="M44 52 H54" />
        <path d="M44 59 H54" />
        <path d="M44 66 H52" />
        <path d="M66 52 H76" />
        <path d="M66 59 H76" />
        <path d="M66 66 H74" />
      </g>
      <ellipse cx="49" cy="34" rx="20" ry="9" fill="#ffffff" opacity=".14" />
    </>
  ),
  Advanced: (
    <>
      <defs>
        <linearGradient id="rb-adv-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="52%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <radialGradient id="rb-adv-disc" cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#3b2069" />
          <stop offset="100%" stopColor="#231144" />
        </radialGradient>
        <linearGradient id="rb-adv-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#rb-adv-ring)" />
      <circle cx="60" cy="60" r="44" fill="url(#rb-adv-disc)" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#ffffff" strokeOpacity=".08" strokeWidth="1.5" />
      <path d="M60 40 L81 47 L81 64 C81 76 71 84 60 89 C49 84 39 76 39 64 L39 47 Z" fill="url(#rb-adv-shield)" />
      <path d="M60 40 L81 47 L81 64 C81 76 71 84 60 89 C49 84 39 76 39 64 L39 47 Z" fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1.4" />
      <path d="M60 40 L60 89 C49 84 39 76 39 64 L39 47 Z" fill="#ffffff" opacity=".1" />
      <path d="M60 52 l2.9 6.4 7 .6 -5.3 4.6 1.6 6.9 -6.2 -3.7 -6.2 3.7 1.6 -6.9 -5.3 -4.6 7 -.6 Z" fill="#faf5ff" />
      <ellipse cx="49" cy="34" rx="20" ry="9" fill="#ffffff" opacity=".13" />
    </>
  ),
  Expert: (
    <>
      <defs>
        <linearGradient id="rb-exp-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="48%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="rb-exp-disc" cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#5a3c08" />
          <stop offset="100%" stopColor="#301f03" />
        </radialGradient>
        <linearGradient id="rb-exp-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="45%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#rb-exp-ring)" />
      <circle cx="60" cy="60" r="44" fill="url(#rb-exp-disc)" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#ffffff" strokeOpacity=".1" strokeWidth="1.5" />
      <path d="M40 78 L80 78 L77 84 L43 84 Z" fill="url(#rb-exp-crown)" />
      <path d="M40 78 L43 55 L51 67 L60 50 L69 67 L77 55 L80 78 Z" fill="url(#rb-exp-crown)" />
      <path d="M40 78 L43 55 L51 67 L60 50 L69 67 L77 55 L80 78 Z" fill="none" stroke="#b45309" strokeOpacity=".5" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="43" cy="55" r="3.4" fill="#fff7d6" />
      <circle cx="60" cy="50" r="3.8" fill="#fff7d6" />
      <circle cx="77" cy="55" r="3.4" fill="#fff7d6" />
      <circle cx="60" cy="72" r="3.2" fill="#ef4444" />
      <path d="M84 40 l1.4 4 4 1.4 -4 1.4 -1.4 4 -1.4 -4 -4 -1.4 4 -1.4 Z" fill="#fffbeb" opacity=".9" />
      <ellipse cx="49" cy="34" rx="20" ry="9" fill="#ffffff" opacity=".16" />
    </>
  ),
};

export const RankBadge = ({ rank }: { rank: string }) => {
  const emblem = emblems[rank as Rank];
  if (!emblem) return null;
  return (
    <svg
      className="rank-badge"
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      {emblem}
    </svg>
  );
};
