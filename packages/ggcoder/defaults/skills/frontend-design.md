---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Bold typography, unexpected layouts, rich visual details — never generic AI aesthetics.
---

# Frontend Design Skill

Create distinctive, production-grade frontend interfaces with high design quality. Generates creative, polished code that avoids generic AI aesthetics.

## Design Thinking

Before coding, commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian
- **Constraints**: Technical requirements (framework, performance, accessibility)
- **Differentiation**: What makes this UNFORGETTABLE?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision.

## Frontend Aesthetics Guidelines

### Typography
Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial, Inter, and Roboto; opt for distinctive choices. Pair a distinctive display font with a refined body font. Use variable weights and tight tracking on headings.

### Color & Theme
Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Define a clear primary, secondary, and accent color. Use tinted shadows that match your palette.

### Motion
Use animations for effects and micro-interactions. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions. Keep animations under 400ms for UI interactions.

### Spatial Composition
Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density. Vary section padding — don't use uniform `py-16` everywhere.

### Backgrounds & Visual Details
Create atmosphere and depth rather than defaulting to solid colors:
- Gradient meshes
- Noise textures
- Geometric patterns
- Layered transparencies
- Dramatic shadows
- Decorative borders
- Custom cursors
- Grain overlays

## What to Avoid — Anti-Slop Rules

NEVER use generic AI-generated aesthetics:

### Visual Bans
- Overused font families (Inter, Roboto, Arial, system fonts as display fonts)
- Equal-width columns on every layout element — vary widths (5/7 + 2/7, or 2/3 + 1/3)
- Cards forced to identical heights with `min-h` — let content dictate height
- `text-center` on everything — center only headlines and CTAs, left-align body text
- `shadow-md` applied uniformly to all cards and buttons — use tinted shadows selectively
- Generic hero: large heading + subtext + button + stock photo in symmetric layout
- Uniform border radius on everything — vary: `rounded-2xl` for cards, `rounded-full` for CTAs

### Layout Bans
- Symmetric padding on every section (`py-16` everywhere)
- Predictable section order: hero → features → testimonials → pricing → CTA
- Three-column equal feature grid as the only layout pattern
- Divider `<hr>` lines between every section (use whitespace and color changes instead)
- Cookie-cutter mobile (just desktop columns stacked)

### Content Bans
- AI superlatives: "Revolutionary", "Game-changing", "Supercharge", "Cutting-edge", "Seamlessly"
- Vague social proof: "Trusted by 1,000+ companies"
- Generic testimonials: "Great product! — John D."
- Round numbers: use "247 clients" not "200+ clients", "8.3x ROI" not "10x growth"
- Emoji as bullet points or list markers — use icons
- Any Lorem ipsum or placeholder text

### Code Bans
- Inline styles for positioning — use Tailwind classes
- `!important` more than twice per file
- `z-index` values above 50 without documentation
- `motion.div` wrapping every element regardless of purpose
- Hardcoded hex colors inline instead of Tailwind classes or CSS variables
- Single component files exceeding 300 lines

## Implementation

Match implementation complexity to the aesthetic vision:
- **Maximalist designs**: Need elaborate code with extensive animations and effects
- **Minimalist designs**: Need restraint, precision, and careful attention to spacing, typography, and subtle details

Elegance comes from executing the vision well.

## Typography Best Practices

```
Headings: tight line-height (1.1–1.2), negative letter-spacing (-0.02em to -0.04em)
Body text: comfortable line-height (1.5–1.7), default letter-spacing
Labels/caps: slightly wider tracking (0.04em+), uppercase, smaller size
```

Body text columns should max at 65–75 characters wide. No text block should span full viewport without max-width constraint.

## Color Best Practices

- Never use pure `#000000` black — use `slate-950` or `zinc-950`
- Tint shadows with your brand/accent color at 5–10% opacity
- Shadow intensity should match element importance
- Ensure WCAG AA contrast ratios: body text ≥ 4.5:1, large text ≥ 3:1
- Commit to a max of 2 accent colors. One for CTAs/emphasis, one for trust/secondary elements.

## Performance Guardrails

- Only animate `transform` and `opacity` (GPU-accelerated). Never animate width, height, padding, margin.
- Client Components only for animations — never import Framer Motion in Server Components
- Use `display: swap` on all font declarations
- Use `next/image` with `loading="lazy"` below fold, `priority` above fold
- z-index discipline: 0–9 base, 10–19 dropdown, 20–29 sticky, 30–39 modal, 40–49 toast

## Output

Working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail
