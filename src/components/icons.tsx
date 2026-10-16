// Hallmark · design-system: design.md · icon voice: glossy gradient tile,
// top highlight, dark glyph inset. Own drawings — no source pixels.
interface IconProps {
  size?: number;
}

function Tile({
  id,
  from,
  to,
  children,
}: {
  id: string;
  from: string;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill={`url(#${id})`} />
      <ellipse cx="32" cy="14" rx="22" ry="9" fill="#fff" opacity="0.35" />
      {children}
    </svg>
  );
}

export function PomodoroIcon({ size = 48 }: IconProps) {
  return (
    <span style={{ width: size, height: size }} className="inline-block drop-shadow-sm">
      <Tile id="pom-grad" from="#2E7D6B" to="#173E3A">
        <circle cx="32" cy="34" r="17" fill="#F4FBF7" />
        <circle
          cx="32"
          cy="34"
          r="17"
          fill="none"
          stroke="#173E3A"
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        {[0, 90, 180, 270].map((deg) => (
          <circle
            key={deg}
            cx={32 + 13 * Math.cos((deg * Math.PI) / 180)}
            cy={34 + 13 * Math.sin((deg * Math.PI) / 180)}
            r="1.6"
            fill="#173E3A"
          />
        ))}
        <line
          x1="32"
          y1="34"
          x2="32"
          y2="24"
          stroke="#173E3A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="34"
          x2="39"
          y2="37"
          stroke="#1F9D8A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="32" cy="34" r="2.4" fill="#173E3A" />
      </Tile>
    </span>
  );
}

export function NotesIcon({ size = 48 }: IconProps) {
  return (
    <span style={{ width: size, height: size }} className="inline-block drop-shadow-sm">
      <Tile id="notes-grad" from="#F6C453" to="#D98A1F">
        <rect x="20" y="14" width="24" height="34" rx="3" fill="#FFFDF4" />
        <path d="M36 14l8 8h-8z" fill="#E8D9B8" />
        <line
          x1="24"
          y1="26"
          x2="40"
          y2="26"
          stroke="#173E3A"
          strokeOpacity="0.55"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="32"
          x2="40"
          y2="32"
          stroke="#173E3A"
          strokeOpacity="0.35"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="38"
          x2="34"
          y2="38"
          stroke="#1F9D8A"
          strokeOpacity="0.7"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </Tile>
    </span>
  );
}

export function HouseIcon({ size = 32 }: IconProps) {
  return (
    <span style={{ width: size, height: size }} className="inline-block drop-shadow-sm">
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id="home-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3AA892" />
            <stop offset="1" stopColor="#1F7A68" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#home-grad)" />
        <ellipse cx="32" cy="14" rx="22" ry="9" fill="#fff" opacity="0.35" />
        <path d="M32 17l14 12v14a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V29z" fill="#F4FBF7" />
        <rect x="27" y="33" width="10" height="12" rx="1.5" fill="#173E3A" />
      </svg>
    </span>
  );
}

export function StartMark({ size = 24 }: IconProps) {
  return (
    <span style={{ width: size, height: size }} className="inline-block">
      <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id="start-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2E7D6B" />
            <stop offset="1" stopColor="#173E3A" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#start-grad)" />
        <g fill="#D9EFE4">
          <rect x="15" y="15" width="15" height="15" rx="4" />
          <rect x="34" y="15" width="15" height="15" rx="4" />
          <rect x="15" y="34" width="15" height="15" rx="4" />
          <rect x="34" y="34" width="15" height="15" rx="7.5" />
        </g>
      </svg>
    </span>
  );
}
