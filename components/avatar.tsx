/*
  Avatar — wyr.css .avatar + .role-*
  Circle with mono initials (up to 2 chars).

  Role → background colour:
    admin     → --a (flame)
    manager   → --b (cobalt)
    publisher → --ink (default dark)
    (none)    → --ink

  Props
    name   — display name; initials are first letter of each word, max 2
    role   — 'admin' | 'manager' | 'publisher' | undefined
    size   — diameter in px (default 34)
*/

type Role = 'admin' | 'manager' | 'publisher'

interface AvatarProps {
  name?:  string
  role?:  Role | string
  size?:  number
  className?: string
}

const ROLE_BG: Record<string, string> = {
  admin:     'var(--a)',
  manager:   'var(--b)',
  publisher: 'var(--ink)',
}

function initials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ name, role, size = 34, className }: AvatarProps) {
  const bg = ROLE_BG[role ?? ''] ?? 'var(--ink)'

  return (
    <div
      className={className}
      aria-label={name}
      style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        background:     bg,
        color:          '#fff',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        fontFamily:     'var(--mono)',
        fontWeight:     700,
        fontSize:       Math.round(size * 0.36),
        lineHeight:     1,
        userSelect:     'none',
      }}
    >
      {initials(name)}
    </div>
  )
}
