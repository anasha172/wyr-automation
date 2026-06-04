import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import Link from 'next/link'
import { LayoutDashboard, Settings, PlusCircle } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WYR Automation — Instagram Story Creator',
  description: 'Automate Would You Rather Instagram Story campaigns end-to-end',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="flex min-h-screen">
          <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-4 gap-1 fixed top-0 left-0 h-full z-10">
            <div className="mb-6 px-2">
              <span className="text-xl font-black text-purple-700 tracking-tight">WYR</span>
              <span className="text-xl font-black text-gray-800"> Auto</span>
            </div>
            <NavItem href="/" icon={<LayoutDashboard size={16} />} label="Dashboard" />
            <NavItem href="/campaigns/new" icon={<PlusCircle size={16} />} label="New Campaign" />
            <div className="flex-1" />
            <NavItem href="/settings" icon={<Settings size={16} />} label="Settings" />
          </aside>
          <main className="ml-56 flex-1 p-8">{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
