'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { GlobalHeader } from '@/components/global-header'

/*
  Shell layout (wyr.css .shell):
    ┌──────────────┬──────────────────────────────┐
    │   Sidebar    │ Topbar (60px, hairline)       │
    │   256px      ├──────────────────────────────┤
    │   paper bg   │ <main>  scroll area           │
    │   flex-col   │ flex-1 overflow-y-auto        │
    └──────────────┴──────────────────────────────┘

  Sidebar is a flex child (not fixed), so no ml-* offset needed on main.
  The outer shell clips to 100vh and each column scrolls independently.

  Standalone routes (no shell): /login  and  /approval/*
*/

const STANDALONE = ['/login']
function isStandalone(pathname: string) {
  return STANDALONE.includes(pathname) || pathname.startsWith('/approval/')
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (isStandalone(pathname)) return <>{children}</>

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--paper)' }}
    >
      <Sidebar />
      {/* Main column — topbar + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <GlobalHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
