export type IconName =
  | 'dashboard'
  | 'layers'
  | 'photo'
  | 'shirt'
  | 'compass'
  | 'calculator'
  | 'printer'
  | 'bulb'
  | 'arrow-right'
  | 'plus'
  | 'minus'
  | 'search'
  | 'download'
  | 'check'
  | 'info'
  | 'zoom-in'
  | 'zoom-out'
  | 'reset'
  | 'type'
  | 'palette'
  | 'grid'
  | 'ruler'
  | 'thread'
  | 'stitch'
  | 'pencil'

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 17 12 21.5 21 17" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.8" />
      <path d="m3 16.5 4.5-4 4 3.5 3.5-3L21 17" />
    </>
  ),
  shirt: <path d="M8 3 4 5.5 2.5 10l3 1.5V21h13v-9.5l3-1.5L20 5.5 16 3a4 4 0 0 1-8 0Z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
      <rect x="7.5" y="6" width="9" height="3.5" rx="1" />
      <circle cx="8.5" cy="13.5" r="1" />
      <circle cx="12" cy="13.5" r="1" />
      <circle cx="15.5" cy="13.5" r="1" />
      <circle cx="8.5" cy="17.5" r="1" />
      <circle cx="12" cy="17.5" r="1" />
      <circle cx="15.5" cy="17.5" r="1" />
    </>
  ),
  printer: (
    <>
      <path d="M7 9V3h10v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <rect x="7" y="14" width="10" height="7" rx="1" />
    </>
  ),
  bulb: (
    <>
      <path d="M9.5 18h5" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.7v.4h5.2v-.4c0-.7.3-1.3.9-1.7A6 6 0 0 0 12 3Z" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  'zoom-in': (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8.5v5M8.5 11h5" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  'zoom-out': (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M8.5 11h5" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  reset: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5V10H9" />
    </>
  ),
  type: (
    <>
      <path d="M4 6.5V4h16v2.5" />
      <path d="M12 4v16" />
      <path d="M8.5 20h7" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-1.8 0-1.4-1.3-1.7-1.3-2.9 0-.8.7-1.3 1.6-1.3H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
      <circle cx="7.5" cy="11.5" r="1.1" />
      <circle cx="11" cy="7.5" r="1.1" />
      <circle cx="15.5" cy="8.5" r="1.1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </>
  ),
  ruler: (
    <>
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <path d="M7 7v3.5M12 7v5M17 7v3.5" />
    </>
  ),
  thread: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" />
      <path d="m14 7 3 3" />
    </>
  ),
  // The brand glyph: a cross stitch sitting in its fabric square.
  stitch: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m7.5 7.5 9 9M16.5 7.5l-9 9" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
