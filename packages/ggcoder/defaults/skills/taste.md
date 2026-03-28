---
name: taste
description: Quality enforcement layer for eliminating generic AI aesthetics. Anti-slop rules, style archetypes, motion choreography, and premium implementation patterns. Use alongside frontend-design for craft-quality output.
---

# Taste — Quality Enforcement Layer

## Purpose & Activation

Taste is a quality enforcement layer that complements the `frontend-design` skill:

- **frontend-design** = "what to build" — creative direction, aesthetic choice
- **taste** = "how to build it with premium quality" — anti-slop rules, detail enforcement, interaction fidelity

**Activate this skill when:**
- Starting any new page or component from scratch
- Reviewing existing UI for quality issues before shipping
- Auditing a page for AI-generated aesthetic patterns
- Implementing animations or micro-interactions
- Choosing between implementation approaches at the detail level

---

## Configuration Dials

Three tunable parameters govern design intensity. Adjust per project or page type.

| Dial | Range | Default | What It Controls |
|------|-------|---------|------------------|
| `DESIGN_VARIANCE` | 1–10 | **6** | 1 = perfectly symmetric, 10 = deliberate chaos. 6 = asymmetric layouts with intentional structure. |
| `MOTION_INTENSITY` | 1–10 | **5** | 1 = no animation, 10 = cinematic sequences. 5 = purposeful reveals + interactions, Core Web Vitals safe. |
| `VISUAL_DENSITY` | 1–10 | **4** | 1 = extreme whitespace, 10 = content-packed. 4 = clean layouts with breathing room. |

**When to override defaults:**
- Checkout/payment pages → `DESIGN_VARIANCE: 4`, `MOTION_INTENSITY: 3` (reduce friction)
- Resource/editorial pages → `DESIGN_VARIANCE: 5`, `VISUAL_DENSITY: 3` (readability priority)
- Hero/above-fold sections → `MOTION_INTENSITY: 7` (first impression matters)

---

## Anti-Slop Detection & Fixes

### Visual Slop

| Pattern | Fix |
|---------|-----|
| Equal-width columns everywhere | Vary: 5/7 + 2/7, or 2/3 + 1/3. Use asymmetric layouts. |
| Identical card heights forced with `min-h` | Let content dictate height. Use masonry or vary padding. |
| `text-center` on everything | Left-align body text. Center only headlines and CTAs. |
| `shadow-md` on all cards/buttons | Tinted shadows selectively. Vary by element importance. |
| Generic hero pattern | Asymmetric layout. Real product shots. Varied headline weight. |
| Uniform border radius | Vary: `rounded-2xl` cards, `rounded-full` CTAs, `rounded-lg` inputs, sharp accents. |
| Identical icon styling | Vary sizes (20–32px), alternate colors, mix contained and inline. |

### Layout Slop

| Pattern | Fix |
|---------|-----|
| Predictable section flow (hero→features→testimonials→pricing→CTA) | Break pattern. Insert proof between pain and solution. Vary section types. |
| Symmetric padding everywhere (`py-16`) | Vary: tight (py-8) after related content, generous (py-20) before new topics. |
| Three-column equal feature grid only | Use 2+1 layout, alternating rows, bento grid, or stacked list. |
| Centered single-column everything | Full-width backgrounds with contained content. Off-center elements. |
| Cookie-cutter mobile | Design mobile-specific layouts. Prioritize differently. Horizontal scroll for cards. |

### Content Slop

| Pattern | Fix |
|---------|-----|
| "Revolutionary", "Game-changing", "Cutting-edge" | Specific claims: "Cuts response time from 4 hours to 12 minutes" |
| "Trusted by 1,000+ companies" | Name actual clients with specific results |
| "Great product! — John D." | Full name, company, specific result |
| Emoji bullet points | Icons with brand color tinting |
| Round numbers ("100+ clients") | Specific: "247 clients", "8.3x average ROI" |
| Feature lists as benefits ("Built with React") | Translate to outcomes: "Loads in under 1 second" |

### Code Slop

| Pattern | Fix |
|---------|-----|
| `z-index: 9999` | Follow discipline: 0–9 base, 10–19 dropdown, 20–29 sticky, 30–39 modal, 40–49 toast |
| `!important` everywhere | Fix CSS specificity properly |
| Inline style positioning | Use Tailwind classes |
| `motion.div` on everything | Animate only meaningful state changes |
| Giant component files (300+ lines) | Extract sub-components |

---

## Premium Implementation Patterns

### Tactile Feedback
```tsx
// Button press feedback
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
>

// Input focus glow — use brand color at 20% opacity
<input className="focus:ring-2 focus:ring-primary/20 focus:border-primary" />
```

### Tinted Shadows
```tsx
// Never use generic grey shadows. Tint with brand/accent color:
className="shadow-[0_4px_24px_rgba(var(--accent-rgb),0.08)]"
// Hover amplification: shadows intensify 1.5–2x on hover
```

### Spring Physics Presets
```tsx
const springPresets = {
  snappy:   { type: "spring", stiffness: 400, damping: 30 },  // buttons, toggles
  standard: { type: "spring", stiffness: 300, damping: 30 },  // cards, sections
  soft:     { type: "spring", stiffness: 200, damping: 25 },  // modals, overlays
  bouncy:   { type: "spring", stiffness: 300, damping: 15 },  // celebrations
}
```

### Staggered Reveals
```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,   // lists: 0.05–0.08s
      delayChildren: 0.1,      // cards: 0.10–0.15s
    },
  },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
}
```

### Micro-Interactions
```tsx
// Card hover — lift 2px, tinted shadow increases
<motion.div
  whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(var(--accent-rgb),0.10)" }}
  transition={{ duration: 0.2, ease: "easeOut" }}
/>

// Toggle slides with bounce
<motion.div
  layout
  transition={{ type: "spring", stiffness: 300, damping: 15 }}
/>
```

### Skeleton Loaders
```tsx
// Match actual content shape — never generic bars
<div className="animate-pulse">
  <div className="flex gap-3 mb-4">
    <div className="h-10 w-10 rounded-full bg-slate-200" />
    <div className="space-y-2 flex-1">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="h-3 w-24 rounded bg-slate-200" />
    </div>
  </div>
</div>
```

---

## Style Archetypes

Pick the archetype before building. Never mix archetype conventions within a single page.

### Standard (Default)
**Use for:** Landing pages, homepage, feature pages, sales pages.

Full brand expression. Sections vary in padding, layout, and density. Typography makes a strong statement. Accent colors used confidently.

- Section padding varies: 80px–120px vertical
- At least one full-bleed section per page (dark or colored background)
- Asymmetric feature layouts preferred: 7/5 or 3/5 column splits
- Spring config: `stiffness: 300, damping: 30`
- Cards: tinted shadows. Buttons: stronger tinted shadows. Hover amplifies 1.5–2x.

### Soft-Premium
**Use for:** Checkout, payment flows, high-stakes conversions.

Reduces cognitive friction, builds trust, slows the eye down. Every choice signals safety.

- Overall padding: 2× standard values
- Max content width: 520px single-column forms, 960px two-column
- Double-bezel card pattern (outer white card with subtle shadow → inner tinted card)
- No scroll-triggered animations (user is in decision mode)
- Softer springs: `stiffness: 200, damping: 25`
- Trust elements positioned strategically: security badges below payment button, guarantee in card header
- Input styling: generous height (h-12), visible borders, brand-color focus ring

### Editorial-Minimal
**Use for:** Resource pages, blog posts, documentation, guides.

Content IS the design. Typography carries the visual weight. Motion is nearly invisible.

- Article content max-width: 720px, centered
- Left-flush body text (never centered)
- Body text: 18px with 1.75 line-height for extended reading
- Bento grid for related resources
- Full-bleed images, not contained in bordered cards
- No scroll-triggered animations for body content
- Links: underline color transitions on hover, 150ms
- Pull quotes: left border accent, italic, generous spacing

---

## Motion Choreography

### Page Load Sequence
```
0ms    — Layout shell renders (SSR)
100ms  — Hero text fades in (opacity 0→1, y: 20→0)
200ms  — Hero CTA appears (opacity 0→1, scale: 0.95→1)
350ms  — Supporting elements stagger in
500ms  — Scroll indicator (if applicable)
```
Keep total load animation under 600ms.

### Scroll-Triggered Reveals
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
```
Always `once: true`. Never re-animate on scroll back up. Avoid horizontal slides (feel dated).

### Exit Animations
Exits should be faster than entrances:
- Modals: `scale: 0.95, opacity: 0` — 200ms
- Toasts: `x: "100%", opacity: 0` — 300ms
- Dropdowns: `y: -8, opacity: 0` — 150ms

### Hover Choreography
- Cards: lift 2px + tinted shadow increase, 200ms ease-out
- Buttons: `scale: 1.02` hover, `scale: 0.97` tap, spring
- Links: underline width 0→100% via background-size, 200ms
- Images: container `overflow-hidden`, image `scale: 1.03`, 300ms

### Reduced Motion
Always respect `prefers-reduced-motion`. Framer Motion handles this automatically with `animate` prop. For custom CSS:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Redesign Audit Checklist (Quick Reference)

When reviewing any page before shipping, check:

1. **Typography**: Font loading with `display: swap`, heading hierarchy, line heights, no orphans
2. **Color**: No pure black, tinted shadows, WCAG contrast ratios met
3. **Layout**: At least one asymmetric section, varied padding, clear visual hierarchy, mobile designed (not just stacked)
4. **Interactivity**: All links/buttons have hover states, press/tap feedback, visible focus rings, scroll reveals below fold
5. **Content**: No AI superlatives, specific testimonials with full names, action-verb CTAs, zero placeholder text
6. **Components**: Tinted card shadows, brand-color input focus, shaped skeleton loaders, designed empty states
7. **Code**: No inline styles, z-index discipline, `motion.div` only for meaningful changes, components under 300 lines

### Fix Priority Order
1. Broken/missing functionality
2. Accessibility violations
3. Content issues (AI slop, placeholders)
4. Visual hierarchy problems
5. Missing interactions
6. Performance issues
7. Polish and refinement
