import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
  Editorial Duel button system.

  Canonical variant names (from wyr.css):
    ink     — primary dark (bg --ink)
    a       — flame / Option A accent
    b       — cobalt / Option B accent
    go      — green / success / approved
    ghost   — outlined, transparent bg
    quiet   — text-only, no border

  Legacy aliases kept so un-restyled pages don't break:
    default     → ink
    outline     → ghost
    destructive → a (flame is the destructive colour in this system)
    secondary   → paper-2 surface
    success     → go
*/

const buttonVariants = cva(
  // Base — shared across all variants
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap leading-none',
    'font-semibold border cursor-pointer',
    'transition-all duration-150 active:translate-y-px',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-40',
  ].join(' '),
  {
    variants: {
      variant: {
        /* ── Canonical ────────────────────────────────────────── */
        ink: [
          'bg-[var(--ink)] text-[var(--paper)] border-transparent',
          'hover:bg-black',
        ].join(' '),

        a: [
          'bg-[var(--a)] text-white border-transparent',
          'hover:brightness-105',
        ].join(' '),

        b: [
          'bg-[var(--b)] text-white border-transparent',
          'hover:brightness-110',
        ].join(' '),

        go: [
          'bg-[var(--go)] text-white border-transparent',
          'hover:brightness-105',
        ].join(' '),

        ghost: [
          'bg-transparent text-[var(--ink)] border-[var(--hair-2)]',
          'hover:bg-[var(--paper-2)] hover:border-[var(--ink-3)]',
        ].join(' '),

        quiet: [
          'bg-transparent text-[var(--ink-2)] border-transparent',
          'hover:bg-[var(--paper-2)] hover:text-[var(--ink)]',
        ].join(' '),

        /* ── Legacy aliases ───────────────────────────────────── */
        default: [
          'bg-[var(--ink)] text-[var(--paper)] border-transparent',
          'hover:bg-black',
        ].join(' '),

        outline: [
          'bg-transparent text-[var(--ink)] border-[var(--hair-2)]',
          'hover:bg-[var(--paper-2)] hover:border-[var(--ink-3)]',
        ].join(' '),

        destructive: [
          'bg-[var(--a)] text-white border-transparent',
          'hover:brightness-105',
        ].join(' '),

        secondary: [
          'bg-[var(--paper-2)] text-[var(--ink)] border-[var(--hair)]',
          'hover:bg-[var(--hair)]',
        ].join(' '),

        success: [
          'bg-[var(--go)] text-white border-transparent',
          'hover:brightness-105',
        ].join(' '),
      },

      size: {
        // Sizes match wyr.css .btn / .btn-sm / .btn-lg exactly
        default: 'px-[18px] py-[10px] text-[14px] rounded-[9px]',
        sm:      'px-[13px] py-[7px]  text-[13px] rounded-[8px] gap-1.5',
        lg:      'px-6      py-[13px] text-[15px] rounded-[9px]',
        icon:    'w-9 h-9 p-0 rounded-[9px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
