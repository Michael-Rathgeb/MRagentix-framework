---
name: api-design
description: API Design — REST, Next.js Route Handlers, Express, Hono, tRPC, validation with Zod, error handling, auth patterns, OpenAPI specs, and production best practices
---

# API Design & Implementation

Complete reference for designing and building APIs across the most common TypeScript stacks. Covers REST conventions, framework-specific patterns, validation, auth, error handling, and documentation.

---

## 1. REST API Conventions

### HTTP Methods & Semantics

| Method | Purpose | Idempotent | Has Body |
|--------|---------|-----------|----------|
| GET | Read resource(s) | Yes | No |
| POST | Create resource | No | Yes |
| PUT | Replace resource entirely | Yes | Yes |
| PATCH | Partial update | No | Yes |
| DELETE | Remove resource | Yes | Optional |

### URL Structure

```
GET    /api/v1/users          # List users
POST   /api/v1/users          # Create user
GET    /api/v1/users/:id      # Get single user
PUT    /api/v1/users/:id      # Replace user
PATCH  /api/v1/users/:id      # Update user fields
DELETE /api/v1/users/:id      # Delete user

# Nested resources
GET    /api/v1/users/:id/posts       # User's posts
POST   /api/v1/users/:id/posts       # Create post for user

# Actions (non-CRUD operations)
POST   /api/v1/users/:id/verify      # Trigger verification
POST   /api/v1/reports/generate       # Trigger report generation
```

### Rules
- Use **plural nouns** for resources: `/users`, not `/user`
- Use **kebab-case**: `/user-profiles`, not `/userProfiles`
- Version your API: `/api/v1/...`
- Use query params for filtering/pagination: `?page=2&limit=20&status=active&sort=-createdAt`
- Never put verbs in URLs — use HTTP methods instead

### Status Codes

```
200 OK              — Successful GET, PUT, PATCH, or DELETE
201 Created         — Successful POST (return Location header)
204 No Content      — Successful DELETE with no response body
400 Bad Request     — Validation error, malformed input
401 Unauthorized    — Missing or invalid auth credentials
403 Forbidden       — Authenticated but not authorized
404 Not Found       — Resource doesn't exist
409 Conflict        — Duplicate resource or state conflict
422 Unprocessable   — Semantically invalid (valid JSON but bad data)
429 Too Many Req    — Rate limited
500 Internal Error  — Unexpected server error
```

### Response Envelope

```typescript
// Success
{
  "data": { "id": "123", "name": "John" },
  "meta": { "requestId": "abc-123" }
}

// List with pagination
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 147,
    "totalPages": 8
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

---

## 2. Next.js Route Handlers (App Router)

Route Handlers live in `app/api/**/route.ts`. Export named functions matching HTTP methods.

### Basic CRUD

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// GET /api/users?page=1&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.user.findMany({ skip: offset, take: limit, orderBy: { createdAt: "desc" } }),
    db.user.count(),
  ]);

  return NextResponse.json({
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/users
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);

    const user = await db.user.create({ data });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: error.flatten().fieldErrors } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 },
    );
  }
}
```

### Dynamic Route Params

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // Next.js 15+: params is async

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: user });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const data = updateUserSchema.parse(body);

  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ data: user });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.user.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
```

### Auth in Route Handlers

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }

  // Use session.user.id for scoped queries
  const data = await db.post.findMany({
    where: { authorId: session.user.id },
  });

  return NextResponse.json({ data });
}
```

### Streaming Responses

```typescript
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: i })}\n\n`));
        await new Promise((r) => setTimeout(r, 1000));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## 3. Express.js

### Setup

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// Error handler (must have 4 params)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
});

app.listen(3000, () => console.log("Server running on :3000"));
```

### Router Pattern

```typescript
// routes/users.ts
import { Router } from "express";
import { z } from "zod";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const users = await db.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  res.json({ data: users, meta: { page, limit } });
});

router.post("/", async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await db.user.create({ data });
    res.status(201).json({ data: user });
  } catch (error) {
    next(error); // Forward to error handler
  }
});

router.get("/:id", async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND" } });
  res.json({ data: user });
});

export default router;
```

### Async Error Wrapper

```typescript
// Wrap async handlers to auto-catch errors
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get("/", asyncHandler(async (req, res) => {
  const users = await db.user.findMany();
  res.json({ data: users });
}));
```

### Express Middleware Pattern

```typescript
// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED" } });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: { code: "INVALID_TOKEN" } });
  }
}

// Apply to routes
router.get("/me", requireAuth, async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.user.id } });
  res.json({ data: user });
});
```

---

## 4. Hono

Modern, lightweight, edge-first framework. Works on Cloudflare Workers, Vercel Edge, Bun, Node.js.

### Setup

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono().basePath("/api/v1");

app.use("*", logger());
app.use("*", cors({ origin: "https://example.com" }));

// Routes
app.get("/users", async (c) => {
  const page = parseInt(c.req.query("page") ?? "1");
  const users = await db.user.findMany({ skip: (page - 1) * 20, take: 20 });
  return c.json({ data: users });
});

app.post(
  "/users",
  zValidator("json", z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })),
  async (c) => {
    const data = c.req.valid("json");
    const user = await db.user.create({ data });
    return c.json({ data: user }, 201);
  },
);

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return c.json({ error: { code: "NOT_FOUND" } }, 404);
  return c.json({ data: user });
});

export default app;
```

### Hono + OpenAPI

```typescript
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

app.get(
  "/users",
  describeRoute({
    summary: "List users",
    operationId: "user.list",
    responses: {
      200: {
        description: "List of users",
        content: { "application/json": { schema: resolver(UserSchema.array()) } },
      },
    },
  }),
  async (c) => {
    const users = await db.user.findMany();
    return c.json(users);
  },
);
```

### Hono Middleware

```typescript
import { createMiddleware } from "hono/factory";

const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const user = await verifyToken(token);
  c.set("user", user);
  await next();
});

app.use("/api/*", authMiddleware);
```

---

## 5. tRPC

Type-safe API layer — no REST routes, full end-to-end type safety between client and server.

### Router Setup

```typescript
// server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

### CRUD Router

```typescript
// server/api/routers/user.ts
export const userRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const users = await ctx.db.user.findMany({
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });
      const total = await ctx.db.user.count();
      return { users, total, page: input.page };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return user;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.user.create({
        data: { ...input, createdById: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return ctx.db.user.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
```

### Client Usage

```typescript
// In a React component / Server Component
const users = await api.user.list({ page: 1, limit: 20 });
const user = await api.user.getById({ id: "123" });
await api.user.create({ name: "Jane", email: "jane@example.com" });
```

---

## 6. Zod Validation Patterns

### Common Schemas

```typescript
import { z } from "zod";

// Pagination
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ID param
const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// User
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin", "moderator"]).default("user"),
  bio: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).default([]),
});

// Partial update (all fields optional)
const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Date range filter
const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  { message: "from must be before to" },
);

// File upload metadata
const uploadSchema = z.object({
  filename: z.string(),
  mimeType: z.string().regex(/^(image|video|application)\//),
  size: z.number().max(10 * 1024 * 1024, "Max 10MB"),
});
```

### Validation Helper

```typescript
function validate<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.flatten().fieldErrors);
  }
  return result.data;
}
```

### Transform & Preprocess

```typescript
const searchSchema = z.object({
  q: z.string().trim().toLowerCase(),
  tags: z
    .string()
    .transform((s) => s.split(",").map((t) => t.trim()))
    .pipe(z.array(z.string()))
    .optional(),
  active: z
    .string()
    .transform((s) => s === "true")
    .pipe(z.boolean())
    .optional(),
});
```

---

## 7. Error Handling

### Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, "NOT_FOUND", `${resource} with id ${id} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>) {
    super(400, "VALIDATION_ERROR", "Invalid input", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}
```

### Error Handler Middleware (Express)

```typescript
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", details: err.flatten().fieldErrors },
    });
  }

  // Prisma unique constraint
  if (err.constructor.name === "PrismaClientKnownRequestError" && (err as any).code === "P2002") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "Resource already exists" },
    });
  }

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
});
```

---

## 8. Authentication Patterns

### JWT Authentication

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";

function generateToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string };
}

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: { code: "INVALID_CREDENTIALS" } });
  }

  const token = generateToken(user.id);
  res.json({ data: { token, user: { id: user.id, name: user.name } } });
});
```

### API Key Authentication

```typescript
async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] || req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    return res.status(401).json({ error: { code: "MISSING_API_KEY" } });
  }

  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  const keyRecord = await db.apiKey.findUnique({ where: { hash: hashedKey } });

  if (!keyRecord || keyRecord.revokedAt) {
    return res.status(401).json({ error: { code: "INVALID_API_KEY" } });
  }

  // Update last used
  await db.apiKey.update({ where: { id: keyRecord.id }, data: { lastUsedAt: new Date() } });
  req.user = { id: keyRecord.userId };
  next();
}
```

---

## 9. Rate Limiting

### Express Rate Limit

```typescript
import rateLimit from "express-rate-limit";

// Global: 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
});

// Auth endpoints: stricter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { code: "RATE_LIMITED", message: "Too many login attempts" } },
});

app.use("/api/", globalLimiter);
app.use("/api/auth/", authLimiter);
```

### Sliding Window with Redis

```typescript
async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = `ratelimit:${req.ip}`;
  const limit = 100;
  const windowSec = 60;

  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, windowSec);

  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - current));

  if (current > limit) {
    return res.status(429).json({ error: { code: "RATE_LIMITED" } });
  }
  next();
}
```

---

## 10. Webhooks

### Receiving Webhooks

```typescript
// Verify webhook signature (Stripe example)
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"]!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
      handleCheckoutComplete(event.data.object);
      break;
    case "invoice.payment_failed":
      handlePaymentFailed(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

### Sending Webhooks

```typescript
async function sendWebhook(url: string, event: string, payload: unknown, secret: string) {
  const body = JSON.stringify({ event, data: payload, timestamp: Date.now() });
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Queue for retry with exponential backoff
    await retryQueue.add("webhook-retry", { url, body, signature }, {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
    });
  }
}
```

---

## 11. OpenAPI / Swagger Documentation

### Inline with Hono

```typescript
import { swaggerUI } from "@hono/swagger-ui";

app.get("/docs", swaggerUI({ url: "/api/openapi.json" }));
app.get("/api/openapi.json", (c) => c.json(openAPIDoc));
```

### Manual OpenAPI Spec (YAML)

```yaml
openapi: "3.1.0"
info:
  title: My API
  version: "1.0.0"
  description: User management API

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    get:
      summary: List users
      operationId: listUsers
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20, maximum: 100 }
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: "#/components/schemas/User" }
                  meta:
                    $ref: "#/components/schemas/Pagination"

    post:
      summary: Create user
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/CreateUser" }
      responses:
        "201":
          description: Created
        "400":
          description: Validation error

components:
  schemas:
    User:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        email: { type: string, format: email }
        createdAt: { type: string, format: date-time }

    CreateUser:
      type: object
      required: [name, email]
      properties:
        name: { type: string, minLength: 1, maxLength: 100 }
        email: { type: string, format: email }

    Pagination:
      type: object
      properties:
        page: { type: integer }
        limit: { type: integer }
        total: { type: integer }
        totalPages: { type: integer }

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - bearerAuth: []
```

---

## 12. CORS Configuration

```typescript
// Express
import cors from "cors";
app.use(cors({
  origin: ["https://app.example.com", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  credentials: true,
  maxAge: 86400, // preflight cache: 24 hours
}));

// Next.js Route Handler
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: "hello" });
  response.headers.set("Access-Control-Allow-Origin", "https://app.example.com");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

// Hono
import { cors } from "hono/cors";
app.use("*", cors({ origin: "https://app.example.com", credentials: true }));
```

---

## 13. File Upload

```typescript
// Next.js Route Handler — FormData
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: { code: "MISSING_FILE" } }, { status: 400 });
  }

  // Validate
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: { code: "FILE_TOO_LARGE" } }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `uploads/${Date.now()}-${file.name}`;

  // Upload to S3
  await s3.putObject({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: file.type });

  return NextResponse.json({ data: { url: `https://cdn.example.com/${key}` } }, { status: 201 });
}
```

---

## Key Gotchas

- **Always validate input** — never trust req.body, query params, or headers. Use Zod on every endpoint
- **Never expose stack traces** — catch errors at the boundary, return safe error messages
- **Use `204 No Content` for DELETE** — don't return the deleted resource
- **Set `Content-Type`** — always `application/json` for JSON APIs
- **Idempotency keys** — for POST endpoints that create resources, accept an `Idempotency-Key` header to prevent duplicates
- **Don't nest resources more than 2 levels** — `/users/:id/posts` is fine, `/users/:id/posts/:postId/comments/:commentId/likes` is not
- **Use cursor-based pagination for large datasets** — offset pagination gets slow at high page numbers
- **Version your API from day one** — `/api/v1/` is cheap insurance
- **Return consistent error shapes** — always `{ error: { code, message, details? } }`
- **Log request IDs** — generate a UUID per request, include in responses and logs for debugging
- **Set reasonable timeouts** — don't let slow DB queries hang forever
- **Prisma P2002 = unique constraint** — catch it and return 409 Conflict, not 500
