---
name: tailwind
description: Tailwind CSS — utility classes, config, plugins, responsive design, dark mode, component patterns
---

# Tailwind CSS Skill

You are now equipped with Tailwind CSS expertise. Write utility-first CSS using Tailwind classes — composing styles directly in markup rather than writing custom CSS.

## Setup & Installation

### PostCSS Setup (v3.x)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`.

### CSS Entry Point

```css
/* globals.css or tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Config Structure

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      // Custom extensions here
    },
  },
  plugins: [],
}
```

**CRITICAL**: The `content` array must include every file that uses Tailwind classes. Missing paths = classes purged from production builds. This is the #1 cause of "it works in dev but not prod".

## Core Utilities

### Layout

```
/* Flexbox */
flex flex-col flex-row flex-wrap items-center justify-between gap-4
flex-1 flex-shrink-0 flex-grow

/* Grid */
grid grid-cols-3 grid-cols-12 grid-rows-2 gap-6 gap-x-4 gap-y-8
col-span-2 col-span-full col-start-2 col-end-5
row-span-2 row-start-1

/* Container */
container mx-auto px-4

/* Positioning */
relative absolute fixed sticky
top-0 left-0 right-0 bottom-0
inset-0 inset-x-0 inset-y-0
z-10 z-20 z-50

/* Display */
block inline-block inline flex grid hidden
```

### Spacing

```
/* Padding */
p-4 px-6 py-2 pt-8 pr-4 pb-6 pl-4

/* Margin */
m-4 mx-auto my-8 mt-6 mr-2 mb-4 ml-0
-mt-4 (negative margin)

/* Space between children */
space-x-4 space-y-2
```

Spacing scale: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96. Each unit = 0.25rem (4px).

### Typography

```
/* Font Size */
text-xs text-sm text-base text-lg text-xl text-2xl text-3xl text-4xl text-5xl text-6xl text-7xl text-8xl text-9xl

/* Font Weight */
font-thin font-light font-normal font-medium font-semibold font-bold font-extrabold font-black

/* Line Height */
leading-none leading-tight leading-snug leading-normal leading-relaxed leading-loose
leading-3 leading-4 leading-5 leading-6 leading-7 leading-8 leading-9 leading-10

/* Letter Spacing */
tracking-tighter tracking-tight tracking-normal tracking-wide tracking-wider tracking-widest

/* Text Alignment */
text-left text-center text-right text-justify

/* Text Transform */
uppercase lowercase capitalize normal-case

/* Text Overflow */
truncate text-ellipsis text-clip
line-clamp-1 line-clamp-2 line-clamp-3 line-clamp-6

/* Wrapping */
whitespace-nowrap whitespace-pre whitespace-normal break-words break-all

/* Text Decoration */
underline no-underline line-through underline-offset-4 decoration-2 decoration-dashed
```

### Colors

```
/* Text */
text-gray-900 text-slate-700 text-blue-500 text-white text-black
text-transparent text-current

/* Background */
bg-white bg-gray-50 bg-slate-900 bg-blue-600 bg-gradient-to-r from-blue-500 to-purple-600

/* Border */
border-gray-200 border-slate-300 border-blue-500 border-transparent

/* Ring (focus outlines) */
ring-2 ring-blue-500 ring-offset-2 ring-offset-white

/* Divide */
divide-y divide-gray-200 divide-x divide-slate-300

/* Placeholder */
placeholder:text-gray-400
```

Color shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950. Lower = lighter. 500 = base.

### Sizing

```
/* Width */
w-full w-screen w-auto w-fit w-min w-max
w-1/2 w-1/3 w-2/3 w-1/4 w-3/4 w-1/5 w-2/5
w-64 w-96 w-px

/* Height */
h-full h-screen h-auto h-fit h-min h-max h-64 h-px
min-h-screen min-h-full min-h-0

/* Min/Max */
min-w-0 min-w-full max-w-sm max-w-md max-w-lg max-w-xl max-w-2xl max-w-4xl max-w-6xl max-w-7xl max-w-screen-xl max-w-prose max-w-none

/* Aspect Ratio */
aspect-auto aspect-square aspect-video
```

### Borders & Rounded

```
/* Border Width */
border border-0 border-2 border-4 border-t border-b border-l border-r

/* Border Radius */
rounded rounded-sm rounded-md rounded-lg rounded-xl rounded-2xl rounded-3xl rounded-full rounded-none
rounded-t-lg rounded-b-lg rounded-l-xl rounded-r-xl

/* Outline */
outline-none outline outline-2 outline-offset-2 outline-blue-500
```

### Shadows & Effects

```
/* Box Shadow */
shadow-sm shadow shadow-md shadow-lg shadow-xl shadow-2xl shadow-inner shadow-none

/* Opacity */
opacity-0 opacity-25 opacity-50 opacity-75 opacity-100

/* Backdrop */
backdrop-blur-sm backdrop-blur backdrop-blur-md backdrop-blur-lg
backdrop-brightness-50 backdrop-saturate-150

/* Blend */
mix-blend-multiply mix-blend-overlay
```

### Overflow & Scroll

```
overflow-hidden overflow-auto overflow-scroll overflow-visible
overflow-x-auto overflow-y-scroll
scroll-smooth scroll-mt-16 scroll-pt-20
overscroll-contain
```

## Responsive Design

Tailwind is **mobile-first**. Unprefixed utilities apply to all screens. Prefixed utilities apply at that breakpoint **and above**.

### Breakpoints

```
sm:   640px   — small tablets
md:   768px   — tablets
lg:   1024px  — laptops
xl:   1280px  — desktops
2xl:  1536px  — large screens
```

### Usage Pattern

```html
<!-- Stack on mobile, row on md+, wider gap on lg+ -->
<div class="flex flex-col md:flex-row gap-4 lg:gap-8">
  <div class="w-full md:w-1/2 lg:w-1/3">...</div>
  <div class="w-full md:w-1/2 lg:w-2/3">...</div>
</div>

<!-- Hide on mobile, show on md+ -->
<nav class="hidden md:flex items-center gap-6">...</nav>

<!-- Different text size per breakpoint -->
<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
  Heading
</h1>

<!-- Grid columns by breakpoint -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  ...
</div>
```

### Container Queries (v3.3+)

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @lg:gap-8">...</div>
</div>
```

Requires `@tailwindcss/container-queries` plugin.

## State Variants

### Interactive States

```html
<!-- Hover, focus, active -->
<button class="bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 transition-colors">
  Click me
</button>

<!-- Focus-visible (keyboard only) -->
<input class="focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none" />

<!-- Disabled -->
<button class="bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled>
  Submit
</button>
```

### Group & Peer

```html
<!-- Group: parent hover affects children -->
<div class="group cursor-pointer rounded-lg p-6 hover:bg-slate-50">
  <h3 class="text-gray-900 group-hover:text-blue-600">Title</h3>
  <span class="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
</div>

<!-- Peer: sibling state affects later siblings -->
<input class="peer" placeholder="Email" />
<p class="hidden peer-invalid:block text-red-500 text-sm">Invalid email</p>

<!-- Named groups for nesting -->
<div class="group/card">
  <div class="group/button">
    <span class="group-hover/card:text-blue-600 group-hover/button:underline">Text</span>
  </div>
</div>
```

### Structural & Data Variants

```html
<!-- First, last, odd, even -->
<li class="first:pt-0 last:pb-0 border-b last:border-b-0">Item</li>
<tr class="odd:bg-white even:bg-gray-50">...</tr>

<!-- Aria states -->
<div class="aria-expanded:bg-gray-100" aria-expanded="true">...</div>
<div class="aria-[current=page]:font-bold">...</div>

<!-- Data attributes -->
<div class="data-[state=active]:bg-blue-500" data-state="active">...</div>

<!-- Before/After pseudo-elements -->
<span class="before:content-['*'] before:text-red-500">Required</span>
<div class="after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/60">
```

### Stacking Variants

Variants can be stacked:

```html
<button class="md:hover:bg-blue-700 dark:hover:bg-blue-400 sm:focus:ring-2">
```

## Dark Mode

### Class Strategy (Recommended)

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
}
```

Toggle by adding `dark` class to `<html>` or a parent element.

```html
<html class="dark">
  <body class="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
    <div class="border-gray-200 dark:border-gray-700">
      <p class="text-gray-600 dark:text-gray-400">Content</p>
    </div>
  </body>
</html>
```

### Media Strategy

```js
// tailwind.config.js
module.exports = {
  darkMode: 'media', // Uses prefers-color-scheme
}
```

### Toggle Implementation

```js
// Simple dark mode toggle
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme',
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
}

// On page load — respect saved preference, fall back to OS preference
const theme = localStorage.getItem('theme');
if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}
```

## Custom Config

### Extending Theme

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        accent: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
}
```

**Use `extend`** to add values without replacing defaults. Defining keys directly under `theme` (not inside `extend`) replaces the entire default scale for that key.

### CSS Custom Properties

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: 'hsl(var(--primary) / <alpha-value>)',
      secondary: 'hsl(var(--secondary) / <alpha-value>)',
      muted: 'hsl(var(--muted) / <alpha-value>)',
    },
  },
}
```

```css
/* globals.css */
@layer base {
  :root {
    --primary: 222.2 84% 4.9%;
    --secondary: 210 40% 96.1%;
    --muted: 210 40% 96.1%;
  }
  .dark {
    --primary: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --muted: 217.2 32.6% 17.5%;
  }
}
```

This is the pattern used by shadcn/ui — theme colors as CSS variables with HSL values, enabling alpha-value support.

### Custom Utilities with @layer

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### Custom Plugins

```js
// tailwind.config.js
const plugin = require('tailwindcss/plugin');

module.exports = {
  plugins: [
    require('@tailwindcss/typography'),  // prose classes
    require('@tailwindcss/forms'),       // form reset
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    plugin(function({ addUtilities, addComponents, matchUtilities, theme }) {
      addUtilities({
        '.content-auto': { 'content-visibility': 'auto' },
        '.text-shadow': { 'text-shadow': '0 2px 4px rgba(0,0,0,0.1)' },
      });
    }),
  ],
}
```

## Animation

### Built-in Animations

```
animate-spin      — continuous rotation (loading spinners)
animate-ping      — ping/pulse effect (notification dots)
animate-pulse     — gentle opacity pulse (skeleton loaders)
animate-bounce    — vertical bounce (scroll indicators)
animate-none      — remove animation
```

### Transitions

```html
<!-- Transition properties -->
<div class="transition-all duration-300 ease-in-out">
<div class="transition-colors duration-200">
<div class="transition-transform duration-150 ease-out">
<div class="transition-opacity duration-500">
<div class="transition-shadow duration-200">

<!-- Duration -->
duration-75 duration-100 duration-150 duration-200 duration-300 duration-500 duration-700 duration-1000

<!-- Easing -->
ease-linear ease-in ease-out ease-in-out

<!-- Delay -->
delay-75 delay-100 delay-150 delay-200 delay-300 delay-500 delay-700 delay-1000

<!-- Transform -->
<div class="hover:scale-105 hover:-translate-y-1 transition-transform duration-200">
  Lift on hover
</div>
```

### Custom Keyframes

```js
// tailwind.config.js
theme: {
  extend: {
    keyframes: {
      'fade-in': {
        '0%': { opacity: '0', transform: 'translateY(10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      'slide-in-right': {
        '0%': { transform: 'translateX(100%)' },
        '100%': { transform: 'translateX(0)' },
      },
      'scale-in': {
        '0%': { opacity: '0', transform: 'scale(0.95)' },
        '100%': { opacity: '1', transform: 'scale(1)' },
      },
      shimmer: {
        '100%': { transform: 'translateX(100%)' },
      },
    },
    animation: {
      'fade-in': 'fade-in 0.3s ease-out',
      'slide-in-right': 'slide-in-right 0.3s ease-out',
      'scale-in': 'scale-in 0.2s ease-out',
      'shimmer': 'shimmer 2s infinite',
    },
  },
}
```

Usage: `animate-fade-in`, `animate-slide-in-right`, `animate-scale-in`.

## Component Patterns

Build components through class composition. Use `@apply` sparingly — only for truly repeated patterns that can't be extracted as components.

### Button

```html
<!-- Primary -->
<button class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
  Button
</button>

<!-- Secondary / Outline -->
<button class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 transition-colors">
  Secondary
</button>

<!-- Ghost -->
<button class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors">
  Ghost
</button>

<!-- Icon button -->
<button class="inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
  <svg class="h-5 w-5" .../>
</button>
```

### Card

```html
<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
  <div class="mb-4">
    <img class="aspect-video w-full rounded-lg object-cover" src="..." alt="..." />
  </div>
  <h3 class="text-lg font-semibold text-gray-900">Card Title</h3>
  <p class="mt-1 text-sm text-gray-600 line-clamp-2">Card description text here.</p>
  <div class="mt-4 flex items-center justify-between">
    <span class="text-sm font-medium text-blue-600">Learn more →</span>
    <span class="text-xs text-gray-400">5 min read</span>
  </div>
</div>
```

### Form Input

```html
<div>
  <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
  <input
    type="email"
    id="email"
    class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
    placeholder="you@example.com"
  />
  <p class="mt-1 text-sm text-red-600 hidden">Error message</p>
</div>

<!-- Select -->
<select class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
  <option>Option 1</option>
</select>

<!-- Textarea -->
<textarea class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm" rows="4"></textarea>
```

### Navigation

```html
<nav class="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <a href="/" class="text-xl font-bold text-gray-900">Logo</a>
    <div class="hidden items-center gap-8 md:flex">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Docs</a>
      <button class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
        Get Started
      </button>
    </div>
    <!-- Mobile menu button -->
    <button class="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
</nav>
```

### Modal / Dialog Overlay

```html
<!-- Backdrop -->
<div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />

<!-- Modal -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Modal Title</h2>
      <button class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
        <svg class="h-5 w-5" .../>
      </button>
    </div>
    <div class="mt-4 text-sm text-gray-600">Modal content here.</div>
    <div class="mt-6 flex justify-end gap-3">
      <button class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
      <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Confirm</button>
    </div>
  </div>
</div>
```

### Badge / Tag

```html
<span class="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
  Active
</span>
<span class="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
  Error
</span>
<span class="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
  Pending
</span>
```

### Skeleton Loader

```html
<div class="animate-pulse space-y-4">
  <div class="h-4 w-3/4 rounded bg-gray-200"></div>
  <div class="h-4 w-full rounded bg-gray-200"></div>
  <div class="h-4 w-5/6 rounded bg-gray-200"></div>
  <div class="flex items-center gap-4 pt-2">
    <div class="h-10 w-10 rounded-full bg-gray-200"></div>
    <div class="flex-1 space-y-2">
      <div class="h-3 w-1/2 rounded bg-gray-200"></div>
      <div class="h-3 w-1/3 rounded bg-gray-200"></div>
    </div>
  </div>
</div>
```

## Tailwind with React / Next.js

### cn() Utility (clsx + tailwind-merge)

The standard pattern for conditional and mergeable Tailwind classes:

```bash
npm install clsx tailwind-merge
```

```ts
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Usage

```tsx
import { cn } from '@/lib/utils';

function Button({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        // Variant styles
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
        variant === 'secondary' && 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        variant === 'ghost' && 'text-gray-700 hover:bg-gray-100',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
        // Size styles
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        // Allow overrides via className prop
        className
      )}
      {...props}
    />
  );
}
```

**Why `twMerge`?** Without it, `cn('px-4', 'px-6')` outputs `"px-4 px-6"` (conflict — last wins in CSS, but unpredictable). With twMerge it outputs `"px-6"` (clean merge).

### Conditional Classes

```tsx
<div className={cn(
  'rounded-lg p-4',
  isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200',
  isDisabled && 'opacity-50 pointer-events-none',
)}>

{/* Array-based for lists */}
{items.map((item, i) => (
  <div key={item.id} className={cn(
    'border-b py-4',
    i === 0 && 'pt-0',
    i === items.length - 1 && 'border-b-0 pb-0',
  )}>
    {item.name}
  </div>
))}
```

### shadcn/ui Pattern

shadcn/ui uses this architecture:
- CSS variables for theme colors (HSL values)
- `cn()` for all class merging
- `cva` (class-variance-authority) for component variants
- Components accept `className` prop for overrides
- Radix UI primitives for behavior

```tsx
// cva pattern for variant definitions
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
```

## Tailwind CSS v4

Tailwind v4 introduces a CSS-first configuration model. Key changes:

### CSS-first Config

```css
/* No more tailwind.config.js — configure in CSS */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --font-display: "Cal Sans", sans-serif;
  --breakpoint-xs: 475px;
  --animate-fade-in: fade-in 0.3s ease-out;
}
```

### What Changed

- `@tailwind base/components/utilities` → `@import "tailwindcss"`
- `tailwind.config.js` → `@theme` directive in CSS
- `content` paths auto-detected (no manual config)
- New default color palette
- All variants work with `not-*` (e.g., `not-hover:opacity-50`)
- `@utility` directive replaces `@layer utilities` with `@apply`
- Native `@starting-style` support for entry animations
- `@custom-variant` for custom variants
- Faster — built on Oxide engine (Rust)

### Migration

For existing v3 projects, continue using v3 patterns. For new projects, evaluate v4 if stability is acceptable. Both patterns are valid.

## Arbitrary Values

Use square bracket notation for one-off values not in the default scale:

```html
<!-- Arbitrary values -->
<div class="w-[calc(100%-2rem)]">
<div class="top-[117px]">
<div class="grid-cols-[1fr_2fr_1fr]">
<div class="bg-[#1a1a2e]">
<div class="text-[clamp(1rem,2.5vw,2rem)]">
<div class="p-[var(--custom-padding)]">
<div class="shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
<div class="content-['hello']">

<!-- Arbitrary properties (when no utility exists) -->
<div class="[mask-image:linear-gradient(to_bottom,black,transparent)]">
<div class="[writing-mode:vertical-rl]">

<!-- Arbitrary variants -->
<div class="[&>*:first-child]:mt-0">
<div class="[&_p]:text-gray-600">
<div class="[@media(hover:hover)]:hover:bg-blue-500">
```

Use underscores for spaces in arbitrary values: `bg-[url('/my_image.png')]`, `grid-cols-[1fr_2fr]`.

## Common Gotchas

### 1. Classes Purged in Production

Tailwind scans files for class names as **complete strings**. Dynamic class construction breaks purging:

```tsx
// ❌ BROKEN — Tailwind can't detect these
const color = `bg-${dynamicColor}-500`;
const size = `text-${size}`;

// ✅ WORKS — complete class strings
const colorMap = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
} as const;
const className = colorMap[color];

// ✅ Also works — safelist in config
// tailwind.config.js
module.exports = {
  safelist: ['bg-red-500', 'bg-blue-500', 'bg-green-500'],
}
```

### 2. Specificity Issues

Tailwind utilities have equal specificity. The last one in the **stylesheet** (not in the class attribute) wins. Use `twMerge` to resolve conflicts, or use `!important`:

```html
<!-- Force override with ! prefix -->
<div class="!mt-0">
```

### 3. @apply Pitfalls

`@apply` should be rare. It defeats the purpose of utility-first and creates maintenance burden. Valid uses:
- Third-party markup you can't add classes to (CMS content, markdown)
- Base styles in `@layer base`

```css
/* ✅ Acceptable: styling prose content from CMS */
@layer base {
  .prose h2 {
    @apply text-2xl font-bold mt-8 mb-4;
  }
}

/* ❌ Avoid: just use classes directly in components */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg;
}
```

### 4. Content Path Misses

Common missing paths that cause classes to be purged:

```js
content: [
  './src/**/*.{js,ts,jsx,tsx}',
  './node_modules/@myorg/ui/**/*.{js,ts,jsx,tsx}', // monorepo packages
  './content/**/*.mdx',                             // MDX content
]
```

### 5. Z-index Wars

Establish a z-index scale and stick to it:

```
z-0   — base content
z-10  — dropdowns, tooltips
z-20  — sticky headers
z-30  — modals, dialogs
z-40  — toasts, notifications
z-50  — critical overlays only
```

### 6. Prose Content (@tailwindcss/typography)

For rich text (markdown, CMS content), use the `prose` class:

```html
<article class="prose prose-lg prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl">
  <!-- rendered markdown here -->
</article>
```

### 7. Size Consistency

Use consistent spacing scales. Don't mix arbitrary values when standard scale values work:

```html
<!-- ❌ Inconsistent -->
<div class="p-[13px] m-[7px] gap-[9px]">

<!-- ✅ Use the scale -->
<div class="p-3 m-2 gap-2">
```
