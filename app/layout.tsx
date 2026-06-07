import type { Metadata } from 'next'
import { Newsreader, Hanken_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/app-shell'

const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'WYR Studio — Editorial Duel',
  description: 'Automate Would You Rather social media campaigns end-to-end',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        <AppShell>{children}</AppShell>
        {/* richColors removed — ink-palette toast styles live in globals.css */}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
