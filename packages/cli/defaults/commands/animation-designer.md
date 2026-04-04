---
name: animation-designer
description: Create smooth, professional web animations with Framer Motion and CSS. Page transitions, scroll effects, micro-interactions, hover states, and loading animations with production-grade patterns.
---

# Animation Designer Skill

Create smooth, professional animations for web applications using Framer Motion and CSS.

## What This Skill Covers

- Page transitions and load choreography
- Component enter/exit animations
- Scroll-triggered reveals
- Hover effects and button interactions
- Loading animations and skeleton states
- Micro-interactions and tactile feedback
- Drag and drop feedback
- Parallax and scroll-driven effects

## Core Principles

### Duration Guidelines
- Too fast: < 100ms (feels abrupt)
- Too slow: > 500ms (feels sluggish)
- Sweet spot: 200–400ms for most UI animations
- High-frequency interactions (used 100s/day): minimal or no animation
- Keyboard-initiated actions: generally no animation

### Performance Rules
- Only animate `transform` (translate, scale, rotate) and `opacity` — GPU accelerated
- Never animate `width`, `height`, `padding`, `margin`, `top`, `left` — triggers layout
- Use `will-change: transform` sparingly, only on elements about to animate
- Keep stagger groups under 20 items
- Use IntersectionObserver (via `whileInView`) instead of scroll listeners
- Test at 4x CPU throttle in DevTools for low-end device feel

### Accessibility
```tsx
import { useReducedMotion } from 'framer-motion'

export function AccessibleAnimation({ children }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
    >
      {children}
    </motion.div>
  )
}
```

## Spring Physics Presets

```tsx
const springs = {
  snappy:   { type: "spring", stiffness: 400, damping: 30 },  // buttons, toggles, checkboxes
  standard: { type: "spring", stiffness: 300, damping: 30 },  // cards, sections, general
  soft:     { type: "spring", stiffness: 200, damping: 25 },  // modals, overlays, pages
  bouncy:   { type: "spring", stiffness: 300, damping: 15 },  // success, celebrations
}
```

## Common Animation Patterns

### Pattern 1: Fade In on Mount
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
  className="p-6 bg-white rounded-lg shadow"
>
  {children}
</motion.div>
```

### Pattern 2: Staggered List Animation
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((text, i) => (
    <motion.li key={i} variants={item}>{text}</motion.li>
  ))}
</motion.ul>
```

### Pattern 3: Button Hover + Press
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
  className="px-6 py-3 bg-primary text-white rounded-lg"
>
  {children}
</motion.button>
```

### Pattern 4: Scroll-Triggered Reveal
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  {children}
</motion.div>
```
Always set `once: true`. Never re-animate on scroll back up.

### Pattern 5: Card Hover with Tinted Shadow
```tsx
<motion.div
  whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(var(--accent-rgb), 0.10)" }}
  transition={{ duration: 0.2, ease: "easeOut" }}
  className="rounded-xl p-6 bg-white"
>
  {children}
</motion.div>
```

### Pattern 6: Modal Enter/Exit
```tsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-30"
        onClick={onClose}
      />
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-30 max-w-lg mx-auto"
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Pattern 7: Animated Link Underline (CSS)
```css
.animated-link {
  text-decoration: none;
  background-image: linear-gradient(currentColor, currentColor);
  background-position: 0% 100%;
  background-repeat: no-repeat;
  background-size: 0% 1px;
  transition: background-size 200ms ease-out;
}
.animated-link:hover {
  background-size: 100% 1px;
}
```

### Pattern 8: Page Load Choreography
```tsx
// Sequence: shell → hero text → CTA → supporting elements
const heroText = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const heroCTA = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }

<motion.h1
  variants={heroText}
  initial="hidden"
  animate="visible"
  transition={{ delay: 0.1, ...springs.standard }}
/>
<motion.div
  variants={heroCTA}
  initial="hidden"
  animate="visible"
  transition={{ delay: 0.2, ...springs.standard }}
/>
```

### Pattern 9: Dropdown/Popover
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ transformOrigin: "top" }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```
Important: Set `transformOrigin` to match where the dropdown appears from.

### Pattern 10: Skeleton Loader
```tsx
<div className="animate-pulse">
  <div className="flex gap-3 mb-4">
    <div className="h-10 w-10 rounded-full bg-slate-200" />
    <div className="space-y-2 flex-1">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="h-3 w-24 rounded bg-slate-200" />
    </div>
  </div>
  <div className="space-y-2">
    <div className="h-3 w-full rounded bg-slate-200" />
    <div className="h-3 w-5/6 rounded bg-slate-200" />
    <div className="h-3 w-4/6 rounded bg-slate-200" />
  </div>
</div>
```
Always match actual content shape — never generic bars.

## Stagger Timing Reference

| Context | staggerChildren | delayChildren |
|---------|----------------|---------------|
| List items | 0.05–0.08s | 0.1s |
| Card grids | 0.10–0.15s | 0.2s |
| Navigation items | 0.03s | 0.05s |
| Form fields | 0.06s | 0.1s |
| Feature sections | 0.12s | 0.15s |

## Exit Animation Rules

Exits should be faster than entrances:
- Modals: 200ms, `scale: 0.95, opacity: 0`
- Toasts: 300ms, `x: "100%", opacity: 0`
- Dropdowns: 150ms, `y: -8, opacity: 0`

## RSC Isolation Rule

Animations live in Client Components only. Always add `'use client'` to any file using `motion.*`:
```tsx
'use client'
import { motion } from 'framer-motion'
```
