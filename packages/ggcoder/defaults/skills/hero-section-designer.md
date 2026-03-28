---
name: hero-section-designer
description: Design high-converting hero sections combining compelling visuals, direct response copy, and clear CTAs. Above-fold optimization where 80% of conversion decisions start.
---

# Hero Section Designer

Frameworks for creating above-fold hero sections that combine imagery, copy, and CTAs into high-converting first impressions.

## Why Hero Sections Matter

- **80% of visitors** never scroll past the fold
- Hero section has **~3 seconds** to capture attention
- Must answer: "What is this? Is it for me? What do I do?"

## Above-Fold Constraint

Maximum 6 elements above the fold:
1. Headline
2. Subheadline
3. Primary CTA
4. Hero visual
5. Trust element
6. Navigation (minimal)

If you have more than 6, you have too many. Cut ruthlessly.

## Hero Section Anatomy

### Component Hierarchy

| Priority | Element | Purpose |
|----------|---------|---------|
| 1 | Headline | Capture attention, communicate value |
| 2 | CTA Button | Clear action to take |
| 3 | Subheadline | Support/clarify headline |
| 4 | Hero Visual | Reinforce message, create emotion |
| 5 | Trust Element | Reduce hesitation |

## Hero Layout Patterns

### Pattern 1: Split Hero (50/50)
Best for: Lead generation, SaaS, professional services

```tsx
<section className="py-20 lg:py-28">
  <div className="container mx-auto px-4">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left: Content */}
      <div className="space-y-6">
        <span className="text-sm font-semibold text-primary uppercase tracking-wider">
          Eyebrow Tag
        </span>
        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
          Main Headline Here That Grabs Attention
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          Supporting subheadline that explains the benefit
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg">Get Started Free</Button>
          <Button variant="outline" size="lg">Watch Demo</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No credit card required · Free 14-day trial
        </p>
      </div>
      {/* Right: Image */}
      <div className="relative">
        <Image src="/hero-image.png" alt="Product dashboard" className="rounded-lg shadow-2xl" />
      </div>
    </div>
  </div>
</section>
```

### Pattern 2: Centered Hero with Background
Best for: Single product focus, strong visual identity

```tsx
<section className="relative min-h-[80vh] flex items-center justify-center">
  <div className="absolute inset-0 z-0">
    <Image src="/hero-bg.jpg" alt="" fill className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/95" />
  </div>
  <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl space-y-6">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
      Main Headline Centered
    </h1>
    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
      Supporting subheadline
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg">Start Free Trial</Button>
      <Button variant="outline" size="lg">Book a Demo</Button>
    </div>
  </div>
</section>
```

### Pattern 3: Product Showcase
Best for: SaaS, software products

Centered text above, large product screenshot below with browser chrome frame and floating notification elements.

### Pattern 4: Minimal Hero
Best for: Strong brand recognition, simple offers

Massive headline (text-7xl+), single CTA, generous whitespace. Typography does all the work.

## Headline Framework

### Headline Formulas
1. **Benefit + Specificity**: "Generate 47 Qualified Leads in 30 Days"
2. **Question + Pain Point**: "Tired of Leads That Never Convert?"
3. **How To + Desired Outcome**: "How to Fill Your Pipeline Without Cold Calling"
4. **Proof + Promise**: "Join 5,000+ Agencies Getting Consistent Leads"

### Subheadline Rules
- Clarify the headline
- Add the "how" or "why"
- Address a secondary objection
- Max 1-2 sentences
- **Formula:** "[How it works] so you can [benefit] without [pain point]"

## CTA Button Guidelines

### Button Copy Hierarchy

| Strength | Example | Use When |
|----------|---------|----------|
| Highest | "Get My Free Strategy" | Lead gen, free offer |
| High | "Start Free Trial" | SaaS, no commitment |
| Medium | "Learn More" | Complex product |
| Never | "Submit" | Never use this |

### CTA Design Rules
- Size: 48px+ height, unmissable
- Color: High contrast from background
- Position: Below headline, above fold
- Spacing: Generous whitespace around button (40px+ breathing room)
- Text: Action verb + benefit (6 words max)
- Complete the sentence: "I want to ___"

### Supporting Microcopy (below button)
- "No credit card required"
- "Free 14-day trial"
- "Takes 30 seconds"
- "Join 5,000+ companies"

## Hero Image Guidelines

| Do | Don't |
|----|-------|
| Product in use / real dashboard | Generic stock photos |
| Real results shown | Handshake images |
| Relevant to offer | Unrelated decorative |
| Professional quality | Low resolution |
| Supports the message | Distracts from CTA |

## Mobile Hero Optimization

- **Headline:** Max 8 words
- **CTA:** Full-width button, 48px+ height
- **Image:** Below text or as background
- **Trust:** Single element, not multiple badges
- **Spacing:** Generous padding, no cramping

```tsx
// Stack order on mobile
<div className="order-2 lg:order-1"> {/* Content */} </div>
<div className="order-1 lg:order-2"> {/* Image — or hidden on mobile */} </div>

// Full width buttons on mobile
<Button className="w-full sm:w-auto">

// Responsive text
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
```

## Trust Element Patterns

### Avatar Stack
```tsx
<div className="flex items-center gap-3">
  <div className="flex -space-x-2">
    {avatars.slice(0, 4).map((src, i) => (
      <Avatar key={i} className="border-2 border-background w-8 h-8" />
    ))}
  </div>
  <span className="text-sm text-muted-foreground">Join 10,000+ happy customers</span>
</div>
```

### Star Rating
```tsx
<div className="flex items-center gap-2">
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
    ))}
  </div>
  <span className="text-sm">4.9/5 from 500+ reviews</span>
</div>
```

### Logo Bar
```tsx
<div className="pt-8 border-t">
  <p className="text-sm text-muted-foreground text-center mb-4">Trusted by industry leaders</p>
  <div className="flex flex-wrap justify-center gap-8 opacity-60">
    <Logo1 className="h-6" /> <Logo2 className="h-6" /> <Logo3 className="h-6" />
  </div>
</div>
```

## Hero Audit Checklist

### Must-Have
- [ ] Clear, benefit-driven headline
- [ ] Visible CTA without scrolling
- [ ] Supporting visual
- [ ] At least one trust element
- [ ] Mobile-optimized layout

### Conversion Optimizers
- [ ] Specificity in headline (numbers, timeframes)
- [ ] CTA uses action verb + benefit
- [ ] Microcopy reduces friction
- [ ] Visual supports message
- [ ] Page loads in under 3 seconds
