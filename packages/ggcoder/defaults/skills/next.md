---
name: next
description: Next.js — App Router, Server Components, RSC patterns, middleware, deployment
---

You are now equipped with Next.js 15+ App Router expertise. Use this knowledge to build production-grade Next.js applications. **App Router only — no Pages Router.**

## Prerequisites

Ensure Next.js 15+ is installed. Create a new project with `npx create-next-app@latest` or install manually:

```bash
npm install next@latest react@latest react-dom@latest
```

Verify with `npx next --version`. Dev server: `npx next dev` (uses Turbopack by default in Next.js 15).

## 1. App Router — File-Based Routing

### Core File Conventions

Every route is a folder inside `app/`. Special files define UI and behavior:

```
app/
├── layout.tsx          # Root layout (required, wraps all pages)
├── page.tsx            # Home route (/)
├── loading.tsx         # Loading UI (auto-wrapped in Suspense)
├── error.tsx           # Error boundary (must be "use client")
├── not-found.tsx       # 404 UI (triggered by notFound())
├── global-error.tsx    # Root error boundary (must be "use client")
├── template.tsx        # Re-renders on navigation (unlike layout)
├── default.tsx         # Fallback for parallel routes
├── blog/
│   ├── page.tsx        # /blog
│   └── [slug]/
│       └── page.tsx    # /blog/my-post (dynamic)
├── shop/
│   └── [...slug]/
│       └── page.tsx    # /shop/a, /shop/a/b/c (catch-all)
├── docs/
│   └── [[...slug]]/
│       └── page.tsx    # /docs AND /docs/a/b (optional catch-all)
```

### Root Layout (required)

```tsx
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "Built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
// In Next.js 15, params is async
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <h1>Post: {slug}</h1>;
}
```

### Catch-All Routes

```tsx
// app/docs/[[...slug]]/page.tsx
export default async function Docs({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  // /docs → slug is undefined
  // /docs/a/b → slug is ["a", "b"]
  return <div>{slug ? slug.join("/") : "Docs home"}</div>;
}
```

### Route Groups

Organize without affecting URL. Prefix folder with `(name)`:

```
app/
├── (marketing)/
│   ├── layout.tsx      # Shared marketing layout
│   ├── about/page.tsx  # /about
│   └── blog/page.tsx   # /blog
├── (app)/
│   ├── layout.tsx      # Shared app layout (e.g., with sidebar)
│   └── dashboard/page.tsx  # /dashboard
```

### Parallel Routes

Render multiple pages in the same layout simultaneously:

```
app/
├── layout.tsx
├── @team/page.tsx       # Slot: team
├── @analytics/page.tsx  # Slot: analytics
└── page.tsx
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <>
      {children}
      {team}
      {analytics}
    </>
  );
}
```

Provide `default.tsx` in each slot to avoid 404 on hard navigation.

### Intercepting Routes

Intercept a route to show it in a modal while keeping context:

```
app/
├── feed/
│   └── page.tsx
├── photo/[id]/
│   └── page.tsx          # Direct navigation: full page
├── @modal/
│   └── (.)photo/[id]/
│       └── page.tsx      # Intercepted: shows in modal
```

Convention: `(.)` same level, `(..)` one level up, `(...)` from root.

### Loading & Error States

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="animate-pulse">Loading dashboard...</div>;
}
```

```tsx
// app/dashboard/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

```tsx
// app/not-found.tsx
export default function NotFound() {
  return <div>Page not found</div>;
}
```

Trigger programmatically with `import { notFound } from "next/navigation"`.

## 2. Server Components vs Client Components

**Server Components** are the default. They run only on the server:
- Can `async/await` directly in the component
- Can access databases, file system, secrets
- Zero client-side JavaScript shipped
- Cannot use hooks (`useState`, `useEffect`) or browser APIs

**Client Components** use `"use client"` directive:
- Required for interactivity, hooks, browser APIs, event handlers
- Still SSR'd on the server, then hydrated on client

```tsx
// app/components/counter.tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

```tsx
// app/page.tsx (Server Component — no directive needed)
import { Counter } from "./components/counter";
import { db } from "@/lib/db";

export default async function Home() {
  const posts = await db.post.findMany(); // Direct DB access
  return (
    <div>
      <h1>Posts ({posts.length})</h1>
      <Counter /> {/* Client component embedded in server component */}
    </div>
  );
}
```

### Rules of Composition

- Server Components can import Client Components ✅
- Client Components CANNOT import Server Components ❌
- Pass Server Components to Client Components as `children` or props ✅

```tsx
// ✅ Pattern: Server Component as children of Client Component
// app/page.tsx (server)
import { ClientWrapper } from "./client-wrapper";
import { ServerData } from "./server-data";

export default function Page() {
  return (
    <ClientWrapper>
      <ServerData /> {/* Stays a Server Component */}
    </ClientWrapper>
  );
}
```

### Streaming with Suspense

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";

async function SlowData() {
  const data = await fetch("https://api.example.com/slow");
  const json = await data.json();
  return <div>{json.title}</div>;
}

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<p>Loading data...</p>}>
        <SlowData />
      </Suspense>
    </div>
  );
}
```

### generateStaticParams

Pre-render dynamic routes at build time:

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return posts.map((post: { slug: string }) => ({ slug: post.slug }));
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ...
}
```

### generateMetadata

Dynamic metadata per page:

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, images: [post.image] },
  };
}
```

## 3. Data Fetching

### Fetch in Server Components

In Next.js 15, `fetch` is **not cached by default**. Opt into caching explicitly:

```tsx
// No cache (default in Next.js 15)
const data = await fetch("https://api.example.com/data");

// Cache indefinitely (like old getStaticProps)
const data = await fetch("https://api.example.com/data", {
  cache: "force-cache",
});

// Revalidate every 60 seconds (ISR)
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 60 },
});

// Tag-based revalidation
const data = await fetch("https://api.example.com/data", {
  next: { tags: ["posts"] },
});
```

### unstable_cache (for non-fetch data)

Cache database queries or any async function:

```tsx
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

const getCachedPosts = unstable_cache(
  async () => {
    return db.post.findMany();
  },
  ["posts"], // cache key
  { revalidate: 60, tags: ["posts"] }
);

export default async function Page() {
  const posts = await getCachedPosts();
  return <div>{/* render posts */}</div>;
}
```

### Route Handlers (API Routes)

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const posts = await db.post.findMany({ take: 10, skip: (+page - 1) * 10 });
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await db.post.create({ data: body });
  return NextResponse.json(post, { status: 201 });
}
```

Dynamic route handler:

```tsx
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}
```

### Server Actions

Define server-side mutations callable from client:

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({ data: { title, content } });
  revalidatePath("/blog");
  redirect("/blog");
}

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });
  revalidatePath("/blog");
}
```

### Form Handling with useActionState

```tsx
// app/components/create-post-form.tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions";

type State = { error?: string; success?: boolean };

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (prevState, formData) => {
      try {
        await createPost(formData);
        return { success: true };
      } catch {
        return { error: "Failed to create post" };
      }
    },
    { error: undefined, success: false }
  );

  return (
    <form action={formAction}>
      <input name="title" required />
      <textarea name="content" required />
      {state.error && <p className="text-red-500">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
```

Simpler pattern — use Server Action directly in form:

```tsx
// app/blog/new/page.tsx (Server Component)
import { createPost } from "@/app/actions";

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## 4. Middleware

File: `middleware.ts` at project root (next to `app/`). Runs before every matched request.

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth check
  const token = request.cookies.get("session")?.value;
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Add custom headers
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

// Only run on matched paths
export const config = {
  matcher: [
    // Match all except static files and api
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Redirects & Rewrites in Middleware

```tsx
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect
  if (pathname === "/old-page") {
    return NextResponse.redirect(new URL("/new-page", request.url));
  }

  // Rewrite (URL stays the same, content changes)
  if (pathname === "/proxy") {
    return NextResponse.rewrite(new URL("https://external-api.com/data"));
  }

  // Geo-based routing
  const country = request.geo?.country ?? "US";
  if (pathname === "/" && country === "DE") {
    return NextResponse.rewrite(new URL("/de", request.url));
  }

  return NextResponse.next();
}
```

### Matcher Patterns

```tsx
export const config = {
  matcher: [
    "/dashboard/:path*",           // /dashboard and all sub-routes
    "/api/:path*",                 // All API routes
    "/((?!_next/static|_next/image|favicon.ico).*)", // All except static
  ],
};
```

**Note:** In Next.js 15.5+, middleware supports the Node.js runtime (stable). Set `runtime: 'nodejs'` in middleware config to access full Node.js APIs.

## 5. Metadata & SEO

### Static Metadata

```tsx
// app/layout.tsx or app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "My App",
    template: "%s | My App", // Child pages: "About | My App"
  },
  description: "My awesome Next.js app",
  metadataBase: new URL("https://example.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "My App",
    description: "My awesome Next.js app",
    url: "https://example.com",
    siteName: "My App",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My App",
    description: "My awesome Next.js app",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

### Dynamic Metadata with generateMetadata

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: "article",
      publishedTime: post.createdAt,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}
```

### Sitemap Generation

```tsx
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({ select: { slug: true, updatedAt: true } });

  const postUrls = posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    ...postUrls,
  ];
}
```

### Robots.txt

```tsx
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

## 6. Image Optimization

### next/image Component

```tsx
import Image from "next/image";

// Local image (auto-sized, blur placeholder generated)
import heroImg from "@/public/hero.jpg";

export default function Page() {
  return (
    <>
      {/* Local image — width/height inferred */}
      <Image src={heroImg} alt="Hero" placeholder="blur" priority />

      {/* Remote image — width/height required */}
      <Image
        src="https://cdn.example.com/photo.jpg"
        alt="Photo"
        width={800}
        height={600}
        className="rounded-lg"
      />

      {/* Fill container */}
      <div className="relative h-64 w-full">
        <Image
          src="/banner.jpg"
          alt="Banner"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </>
  );
}
```

### Remote Patterns in next.config

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.example.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      // Also supports new URL() syntax in Next.js 15.3+
    ],
  },
};

module.exports = nextConfig;
```

### Key Props

- `priority` — preload (use for LCP/above-fold images)
- `placeholder="blur"` — low-quality blur while loading (auto for local, provide `blurDataURL` for remote)
- `sizes` — responsive size hints (critical for `fill` images)
- `quality` — 1-100 (default 75)
- `fill` — fills parent container (parent needs `position: relative`)

## 7. Performance

### Dynamic Imports (Lazy Loading)

```tsx
import dynamic from "next/dynamic";

// Lazy load a heavy client component
const HeavyChart = dynamic(() => import("./components/chart"), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Skip SSR for client-only components
});

export default function Dashboard() {
  return <HeavyChart />;
}
```

### Font Optimization

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

Local font:

```tsx
import localFont from "next/font/local";

const myFont = localFont({
  src: "./fonts/MyFont.woff2",
  variable: "--font-custom",
  display: "swap",
});
```

### ISR (Incremental Static Regeneration)

```tsx
// app/blog/[slug]/page.tsx

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <article>{post.content}</article>;
}
```

### On-Demand Revalidation

```tsx
// app/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function publishPost(id: string) {
  await db.post.update({ where: { id }, data: { published: true } });

  revalidatePath("/blog");          // Revalidate a specific path
  revalidatePath("/blog/[slug]", "page"); // Revalidate dynamic route
  revalidateTag("posts");           // Revalidate all fetches tagged "posts"
}
```

Via Route Handler:

```tsx
// app/api/revalidate/route.ts
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { tag, secret } = await request.json();
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag(tag);
  return NextResponse.json({ revalidated: true });
}
```

## 8. Common Patterns

### Authentication with Middleware

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/settings", "/admin"];
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
```

### Protected Server Component

```tsx
// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) redirect("/login");
  const user = await verifySession(session);
  if (!user) redirect("/login");

  return <div>Welcome, {user.name}</div>;
}
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."          # Server-only (not exposed to browser)
NEXT_PUBLIC_APP_URL="https://example.com" # Available in browser (bundled in client JS)
API_SECRET="secret123"                    # Server-only
```

Access:

```tsx
// Server Component / Server Action / Route Handler
const dbUrl = process.env.DATABASE_URL; // ✅ Works

// Client Component
const appUrl = process.env.NEXT_PUBLIC_APP_URL; // ✅ Works (NEXT_PUBLIC_ prefix)
const secret = process.env.API_SECRET; // ❌ undefined in client
```

### Database Integration (Prisma)

```tsx
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### Database Integration (Drizzle)

```tsx
// lib/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

### i18n Routing

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["en", "de", "fr"];
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  const headers = { "accept-language": request.headers.get("accept-language") ?? "" };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) return NextResponse.next();

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
```

With folder structure:

```
app/
├── [lang]/
│   ├── layout.tsx
│   ├── page.tsx
│   └── dictionaries.ts
```

## 9. Deployment

### Vercel (Default)

Zero-config. Push to Git, Vercel auto-detects Next.js.

```bash
npm i -g vercel
vercel          # Preview deploy
vercel --prod   # Production deploy
```

### Standalone Output (Docker)

```js
// next.config.js
module.exports = {
  output: "standalone",
};
```

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### Static Export

```js
// next.config.js
module.exports = {
  output: "export",
};
```

Generates static HTML into `out/`. No server required. Limitations: no Server Components at runtime, no middleware, no ISR, no image optimization (use a loader).

### Runtime Selection

```tsx
// Per-route runtime
export const runtime = "edge";    // Edge Runtime (lightweight, fast cold starts)
export const runtime = "nodejs";  // Node.js Runtime (default, full API access)
```

Edge Runtime limitations: no `fs`, no native Node.js modules, 4MB function size limit on Vercel.

## 10. next.config.js

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.example.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },

  // Redirects (run at request time)
  async redirects() {
    return [
      {
        source: "/old-blog/:slug",
        destination: "/blog/:slug",
        permanent: true, // 308
      },
    ];
  },

  // Rewrites (URL stays the same)
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "https://external-api.com/:path*",
      },
    ];
  },

  // Custom headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Output mode
  // output: "standalone",  // For Docker
  // output: "export",      // For static HTML

  // Experimental features
  experimental: {
    ppr: true,              // Partial Prerendering
    typedRoutes: true,      // Type-safe Link href
  },

  // Turbopack config (Next.js 15+)
  // turbopack: { ... },

  // Strict mode
  reactStrictMode: true,

  // Trailing slashes
  trailingSlash: false,

  // Base path (serve from subpath)
  // basePath: "/app",

  // Environment variables (build-time only)
  env: {
    CUSTOM_VAR: "value",
  },

  // Webpack customization (when not using Turbopack)
  webpack: (config) => {
    // Customize webpack config
    return config;
  },
};

module.exports = nextConfig;
```

## Key Gotchas

- **Next.js 15 breaking change:** `params`, `searchParams`, `cookies()`, `headers()` are now **async**. Always `await` them.
- **Next.js 15 caching change:** `fetch` and GET Route Handlers are **uncached by default**. Opt in with `cache: "force-cache"` or `next: { revalidate: N }`.
- Server Components are the default. Only add `"use client"` when you need interactivity.
- `"use client"` marks the **boundary** — everything imported by that file becomes client code.
- `"use server"` marks functions as Server Actions — callable from client, executed on server.
- `error.tsx` must be a Client Component (`"use client"`).
- `layout.tsx` does NOT re-render on navigation — use `template.tsx` if you need that.
- `loading.tsx` is syntactic sugar for wrapping `page.tsx` in `<Suspense>`.
- Environment variables without `NEXT_PUBLIC_` prefix are **never** exposed to the browser.
- Always provide `sizes` prop with `fill` images to avoid layout shift.
- Use `revalidatePath` / `revalidateTag` in Server Actions for cache busting — don't use `router.refresh()` as a substitute.
- Middleware runs on **every request** for matched paths — keep it fast. Use Node.js runtime (stable in 15.5) only when needed.
- For Prisma: use the singleton pattern to avoid exhausting connections in development.
