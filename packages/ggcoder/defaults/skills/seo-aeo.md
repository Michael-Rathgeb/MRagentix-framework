---
name: seo-aeo
description: Technical SEO & AEO — structured data, schema markup, entity optimization, Core Web Vitals, Answer Engine Optimization, and site architecture for search & AI engines
---

# Technical SEO & Answer Engine Optimization (AEO)

Complete reference for building sites that rank in traditional search AND get cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews, voice assistants).

---

## 1. On-Page SEO Fundamentals

### Title Tags
- **Length**: 30–60 characters (Google truncates at ~60)
- Every page must have a unique `<title>`
- Front-load the primary keyword
- Include brand name at the end: `Primary Keyword — Brand Name`

```html
<title>Emergency Roof Repair in St. Louis — Trill Roofing</title>
```

### Meta Descriptions
- **Length**: 120–160 characters
- Must be unique per page — duplicates waste SERP real estate
- Include a call to action and the primary keyword
- Google may rewrite them, but they still influence CTR

```html
<meta name="description" content="24/7 emergency roof repair in St. Louis. Storm damage, leaks, missing shingles — free inspection. Call (314) 555-0100.">
```

### Heading Hierarchy
- Exactly **one H1** per page — matches the page topic
- H2s for major sections, H3s for subsections
- Don't skip levels (H1 → H3 without H2)
- Include keyword variations naturally in headings

### Canonical URLs
- Every indexable page needs a `<link rel="canonical">` pointing to itself
- Prevents duplicate content from query parameters, trailing slashes, etc.

```html
<link rel="canonical" href="https://example.com/services/roof-repair">
```

### Open Graph & Twitter Cards

```html
<meta property="og:title" content="Emergency Roof Repair — Trill Roofing">
<meta property="og:description" content="24/7 emergency roof repair in St. Louis.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/services/roof-repair">
<meta property="og:image" content="https://example.com/images/roof-repair-og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Emergency Roof Repair — Trill Roofing">
```

---

## 2. Structured Data / JSON-LD Schema

### The @graph Pattern
Use a single `<script type="application/ld+json">` block per page with an `@graph` array. This connects all entities into a unified knowledge graph.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://example.com#website", ... },
    { "@type": "LocalBusiness", "@id": "https://example.com#business", ... },
    { "@type": "WebPage", "@id": "https://example.com/page", ... },
    { "@type": "BreadcrumbList", ... },
    { "@type": "FAQPage", ... }
  ]
}
</script>
```

### Entity Anchoring with @id
Every entity in the graph needs an `@id` — a stable URI fragment. All pages must reference the **same** @id for the business entity to build a connected graph:

- `https://example.com#business` — the business entity
- `https://example.com#website` — the website entity
- `https://example.com/page#faqpage` — page-specific entities

Cross-reference with `"publisher": {"@id": "https://example.com#business"}`.

### LocalBusiness Schema (Full)

```json
{
  "@type": "LocalBusiness",
  "@id": "https://example.com#business",
  "name": "Business Name",
  "url": "https://example.com",
  "telephone": "+1-314-555-0100",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "St. Louis",
    "addressRegion": "MO",
    "postalCode": "63101",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 38.627003,
    "longitude": -90.199404
  },
  "areaServed": {
    "@type": "City",
    "name": "St. Louis, MO",
    "sameAs": [
      "https://en.wikipedia.org/wiki/St._Louis",
      "https://www.wikidata.org/wiki/Q38022"
    ]
  },
  "sameAs": [
    "https://www.google.com/search?kgmid=/g/KGMID_HERE",
    "https://www.google.com/maps?cid=CID_HERE",
    "https://www.facebook.com/businesspage",
    "https://www.yelp.com/biz/business-name"
  ],
  "identifier": {
    "@type": "PropertyValue",
    "propertyID": "GoogleKGMID",
    "value": "/g/KGMID_HERE"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 127,
    "bestRating": 5,
    "worstRating": 1
  },
  "knowsAbout": [
    {
      "@type": "Thing",
      "name": "Roof Repair",
      "sameAs": "https://en.wikipedia.org/wiki/Roof"
    },
    "Storm Damage Repair",
    "Roof Inspection"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Roofing Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Roof Replacement",
          "description": "Complete roof replacement including tear-off and new installation."
        }
      }
    ]
  },
  "priceRange": "$$"
}
```

### Entity Locking
Lock your business to the Google Knowledge Graph:

1. **KGMID** — Google Knowledge Graph Machine ID. Add to `sameAs` as `https://www.google.com/search?kgmid=/g/KGMID` and as an explicit `identifier`
2. **CID** — Google Maps Customer ID. Add `https://www.google.com/maps?cid=CID` to `sameAs`
3. **Wikidata enrichment** — Enrich `areaServed` cities and `knowsAbout` topics with Wikipedia/Wikidata `sameAs` URLs for stronger entity signals

### FAQPage Schema (AEO-Optimized)

```json
{
  "@type": "FAQPage",
  "@id": "https://example.com/faq/roof-repair#faqpage",
  "name": "Roof Repair FAQ",
  "datePublished": "2024-01-15",
  "dateModified": "2024-03-01",
  "author": {"@type": "Organization", "name": "Business Name"},
  "publisher": {"@type": "Organization", "name": "Business Name"},
  "inLanguage": "en-US",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".answer", "h1", "h2"]
  },
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does roof repair cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Roof repair costs typically range from $300 to $1,500 depending on..."
      }
    }
  ]
}
```

### SpeakableSpecification
Critical for voice search and AI answer engines. Tells crawlers which content is suitable for text-to-speech:

```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": [".answer", "h1", "h2"]
}
```

### BreadcrumbList Schema

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com"},
    {"@type": "ListItem", "position": 2, "name": "Services", "item": "https://example.com/services"},
    {"@type": "ListItem", "position": 3, "name": "Roof Repair", "item": "https://example.com/services/roof-repair"}
  ]
}
```

### WebSite Schema (with SearchAction)

```json
{
  "@type": "WebSite",
  "@id": "https://example.com#website",
  "name": "Business Name",
  "url": "https://example.com",
  "publisher": {"@id": "https://example.com#business"},
  "inLanguage": "en-US",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.com/?s={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### Service Schema

```json
{
  "@type": "Service",
  "@id": "https://example.com#service-roof-repair",
  "name": "Roof Repair",
  "description": "Expert roof repair for leaks, storm damage, and missing shingles in St. Louis, MO.",
  "serviceType": "Roof Repair",
  "provider": {"@id": "https://example.com#business"},
  "areaServed": {"@type": "City", "name": "St. Louis, MO"}
}
```

### Required Properties by Schema Type

| Type | Required Properties |
|------|-------------------|
| Article | headline, author, datePublished, image |
| LocalBusiness | name, address, telephone |
| Organization | name, url, logo |
| FAQPage | mainEntity |
| BreadcrumbList | itemListElement |
| Product | name, image, description |
| Event | name, startDate, location |
| HowTo | name, step |
| Review | reviewRating, author, itemReviewed |

### Rich Result Eligible Types
These schema types can trigger rich results in Google: Article, NewsArticle, BlogPosting, Product, Review, AggregateRating, FAQPage, HowTo, Recipe, Event, LocalBusiness, Organization, BreadcrumbList, VideoObject, Course, JobPosting, SoftwareApplication.

---

## 3. Technical SEO Checklist

### Crawlability
- `robots.txt` — don't block CSS/JS, ensure Sitemap directive is present
- Never `noindex` the homepage
- Fix redirect chains (max 1 hop, never 3+)
- Fix broken internal links (4xx/5xx targets)
- All internal links should point to final URLs, not redirects

### Indexability
- Every page returns 200 status
- Canonical tags are self-referencing on indexable pages
- No accidental `noindex` on important pages
- Submit XML sitemap to Google Search Console

### HTTPS
- All pages served over HTTPS
- No mixed content (HTTP resources on HTTPS pages)
- HTTP → HTTPS redirect in place

### Images
- Every `<img>` has descriptive `alt` text
- Images have explicit `width` and `height` attributes (prevents CLS)
- Use modern formats: WebP or AVIF with fallbacks
- Lazy load below-fold images: `loading="lazy"`
- Prioritize above-fold images: `fetchpriority="high"`

### XML Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-03-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/services/roof-repair</loc>
    <lastmod>2024-03-01</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

### robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml
```

---

## 4. Core Web Vitals

### LCP (Largest Contentful Paint) — Target: < 2.5s
- Preload hero image: `<link rel="preload" as="image" href="hero.webp">`
- Use `fetchpriority="high"` on the LCP image
- Minimize render-blocking CSS/JS
- Use a CDN for static assets

### INP (Interaction to Next Paint) — Target: < 200ms
- Break up long tasks (> 50ms)
- Defer non-critical JavaScript
- Use `requestAnimationFrame` for visual updates
- Avoid layout thrashing

### CLS (Cumulative Layout Shift) — Target: < 0.1
- Set explicit `width`/`height` on images and iframes
- Use `aspect-ratio` CSS for responsive containers
- Reserve space for ads/embeds
- Use `font-display: swap` with font preloading

### Performance Meta Tags

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="/images/hero.webp">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
```

---

## 5. Answer Engine Optimization (AEO)

AEO optimizes content to be selected as answers by AI engines (ChatGPT, Perplexity, Google AI Overviews, Alexa, Siri).

### Hub & Spoke Content Architecture
- **Hub pages**: Topic overview with all Q&A pairs — triggers FAQPage rich results
- **Spoke pages**: Individual question pages with deep answers — targeted long-tail queries
- Both hub and spoke pages get full @graph schema (LocalBusiness + FAQPage + WebPage + BreadcrumbList)

### Question-Answer Format
Structure content as direct Q&A — the format AI engines prefer:

```html
<h2>How much does roof repair cost in St. Louis?</h2>
<div class="answer">
  <p>Roof repair in St. Louis typically costs between $300 and $1,500 for minor repairs...</p>
</div>
```

### AEO Content Rules
1. **Answer first** — Put the direct answer in the first 1-2 sentences. Details come after
2. **Use the question as the heading** — H2 should be the exact question people search
3. **Include entity context** — Mention the business name, city, and service area in answers
4. **Add Speakable markup** — `SpeakableSpecification` on answer containers
5. **Date your content** — `datePublished` and `dateModified` in schema
6. **Author attribution** — Link answers to the business entity as author/publisher

### People Also Ask (PAA) Scraping Pipeline
1. **Scrape**: Extract PAA questions from Google for target keywords
2. **Cluster**: Group questions into topical clusters using semantic similarity
3. **Generate**: Write authoritative answers with entity context
4. **Build**: Generate static HTML pages with full @graph schema
5. **Deploy**: Deploy as static sites with proper sitemap and robots.txt

### Internal Linking for AEO
- Hub pages link to all spoke pages in the cluster
- Spoke pages link back to their hub and to related spokes
- Every page links to the homepage (site-wide nav)
- Use descriptive anchor text matching the target page's H1

---

## 6. Local SEO

### Google Business Profile Signals
- NAP consistency (Name, Address, Phone) across all citations
- Same NAP in schema markup as on GBP
- GBP URL in `sameAs` array
- Categories match actual services

### Citation Building
- Consistent NAP on major directories (Yelp, BBB, industry-specific)
- All citation URLs added to `sameAs` in schema
- Match business name exactly — no keyword stuffing

### Geo-Targeted Pages
For businesses serving multiple cities:
- Create city-specific pages with unique content
- Use `GeoCircle` `areaServed` with coordinates and radius
- Enrich city names with Wikidata `sameAs` for entity disambiguation
- Each city page gets its own BreadcrumbList (Home > Service Areas > City)

```json
"areaServed": {
  "@type": "GeoCircle",
  "geoMidpoint": {
    "@type": "GeoCoordinates",
    "latitude": 38.627,
    "longitude": -90.199
  },
  "geoRadius": "25 mi"
}
```

---

## 7. Schema Validation

### Required Checks
1. Every page has `@context: "https://schema.org"`
2. Every entity has an `@id`
3. All pages reference the same Organization `@id` (unified graph)
4. FAQPage has `mainEntity` with at least one Question
5. Each Question has a `name` and `acceptedAnswer.text`
6. LocalBusiness has `name`, `telephone`, and `sameAs` (entity lock)
7. BreadcrumbList URLs match actual crawled URLs

### Testing Tools
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
- Google Search Console → Enhancements tab

---

## 8. Site Architecture Best Practices

### URL Structure
- Short, readable, keyword-rich URLs
- Use hyphens, not underscores
- No query parameters for indexable content
- Consistent trailing slash policy (pick one, redirect the other)

### Flat Architecture
- Important pages should be ≤ 3 clicks from homepage
- Use HTML sitemaps for deep content
- Avoid orphan pages (no internal links pointing to them)

### Page Speed Budget
- HTML document: < 100KB
- Total page weight: < 2MB
- Minimize third-party scripts
- Defer non-critical CSS with `media="print" onload="this.media='all'"`

```html
<link rel="stylesheet" href="critical.css">
<link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
```

---

## 9. Content Quality Signals

### Thin Content
Pages with < 300 words are flagged as thin content by crawlers. Ensure every indexable page has substantive content.

### E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trust)
- Author/publisher attribution in schema
- About page with team/expertise info
- Contact information accessible from every page
- Links to/from authoritative industry sources
- Customer reviews and testimonials with structured data
- Certifications, licenses, and awards mentioned

### Freshness Signals
- Include `datePublished` and `dateModified` in schema
- Update content regularly (AI engines prefer recent content)
- Track content freshness and flag stale pages

---

## 10. Hreflang (International SEO)

For multi-language sites:

```html
<link rel="alternate" hreflang="en" href="https://example.com/page">
<link rel="alternate" hreflang="es" href="https://example.com/es/page">
<link rel="alternate" hreflang="x-default" href="https://example.com/page">
```

Rules:
- Every page in the set must reference all other versions (including itself)
- Use `x-default` for the fallback language
- hreflang values must be valid ISO 639-1 language codes
- Can be in `<head>`, HTTP headers, or XML sitemap
