---
name: testing
description: Testing — unit, integration, and e2e testing with Vitest, Jest, Playwright, and Testing Library
---

You are now equipped with comprehensive testing expertise. Use this knowledge to write robust, maintainable tests for any TypeScript/JavaScript project.

## 1. Vitest

### Setup

Install Vitest:

```bash
npm install -D vitest @vitest/coverage-v8
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true, // enables describe/it/expect without imports
    environment: "node", // or "jsdom" for browser-like env
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "e2e"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/**/*.spec.*", "src/test/**"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    // Path aliases — match your tsconfig
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Enable globals in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Core Patterns

```ts
// src/utils/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Cannot divide by zero");
  return a / b;
}
```

```ts
// src/utils/math.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { add, divide } from "./math";

describe("math utils", () => {
  describe("add", () => {
    it("adds two positive numbers", () => {
      expect(add(1, 2)).toBe(3);
    });

    it("handles negative numbers", () => {
      expect(add(-1, -2)).toBe(-3);
    });
  });

  describe("divide", () => {
    it("divides two numbers", () => {
      expect(divide(10, 2)).toBe(5);
    });

    it("throws on division by zero", () => {
      expect(() => divide(10, 0)).toThrow("Cannot divide by zero");
    });
  });
});
```

### Mocking

```ts
// vi.fn() — standalone mock function
const mockCallback = vi.fn();
mockCallback("hello");
expect(mockCallback).toHaveBeenCalledWith("hello");
expect(mockCallback).toHaveBeenCalledTimes(1);

// vi.fn() with implementation
const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => ({ id: 1 }) });

// vi.spyOn — spy on existing object method
import * as userService from "./user-service";

const spy = vi.spyOn(userService, "getUser").mockResolvedValue({ id: "1", name: "Alice" });
// ... run code that calls getUser ...
expect(spy).toHaveBeenCalledWith("1");
spy.mockRestore(); // restore original implementation
```

### Module Mocking

```ts
// Mock an entire module
vi.mock("./database", () => ({
  db: {
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "1", name: "Alice" }]),
      create: vi.fn().mockResolvedValue({ id: "2", name: "Bob" }),
    },
  },
}));

// Mock with auto-mocking (all exports become vi.fn())
vi.mock("./analytics");

// Partial mock — keep real implementation, override specific exports
vi.mock("./utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils")>();
  return {
    ...actual,
    formatDate: vi.fn().mockReturnValue("2024-01-01"),
  };
});

// Mock a node module
vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));
```

### Snapshot Testing

```ts
it("matches snapshot", () => {
  const result = generateConfig({ env: "production" });
  expect(result).toMatchSnapshot();
});

it("matches inline snapshot", () => {
  const result = formatUser({ id: "1", name: "Alice" });
  expect(result).toMatchInlineSnapshot(`
    {
      "displayName": "Alice",
      "id": "1",
    }
  `);
});
```

### Testing Async Code

```ts
it("fetches user data", async () => {
  const user = await fetchUser("1");
  expect(user).toEqual({ id: "1", name: "Alice" });
});

it("rejects with error for invalid id", async () => {
  await expect(fetchUser("invalid")).rejects.toThrow("User not found");
});
```

### Timer Mocking

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls function after delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

### Setup and Teardown

```ts
// src/test/setup.ts — global test setup
import { beforeAll, afterAll, afterEach } from "vitest";

beforeAll(async () => {
  // Run once before all tests — start test server, connect DB, etc.
});

afterEach(() => {
  // Run after each test — cleanup mocks, reset state
  vi.restoreAllMocks();
});

afterAll(async () => {
  // Run once after all tests — disconnect DB, stop server, etc.
});
```

## 2. Jest

### Setup

```bash
npm install -D jest ts-jest @types/jest
```

Create `jest.config.ts`:

```ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node", // or "jsdom"
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.{test,spec}.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Handle CSS modules
    "\\.(css|less|scss)$": "identity-obj-proxy",
    // Handle static assets
    "\\.(jpg|jpeg|png|svg)$": "<rootDir>/src/test/__mocks__/fileMock.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  setupFilesAfterSetup: ["<rootDir>/src/test/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.*",
    "!src/**/*.spec.*",
    "!src/test/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
```

Add scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

### Jest-Specific Mocking

```ts
// jest.fn()
const mockFn = jest.fn().mockReturnValue(42);
const mockAsync = jest.fn().mockResolvedValue({ data: "test" });

// jest.mock() — module mock (hoisted to top of file automatically)
jest.mock("./database", () => ({
  db: {
    query: jest.fn(),
  },
}));

// jest.spyOn
const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
// ... test code ...
expect(consoleSpy).toHaveBeenCalledWith("Something went wrong");
consoleSpy.mockRestore();

// jest.mock with factory + requireActual
jest.mock("./config", () => {
  const actual = jest.requireActual("./config");
  return {
    ...actual,
    getApiUrl: jest.fn().mockReturnValue("http://test-api.com"),
  };
});
```

### Fake Timers

```ts
describe("scheduler", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs callback after interval", () => {
    const callback = jest.fn();
    startInterval(callback, 1000);

    jest.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("can set system time", () => {
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    expect(getCurrentDate()).toBe("2024-01-15");
  });
});
```

### Manual Mocks

Create `__mocks__` directory next to the module:

```
src/
├── services/
│   ├── __mocks__/
│   │   └── api.ts       # Manual mock for api.ts
│   └── api.ts            # Real module
```

```ts
// src/services/__mocks__/api.ts
export const fetchData = jest.fn().mockResolvedValue({ items: [] });
export const postData = jest.fn().mockResolvedValue({ success: true });
```

```ts
// In test file — just call jest.mock, it finds __mocks__ automatically
jest.mock("./services/api");
```

## 3. React Testing Library

### Setup

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Setup file (works with both Vitest and Jest):

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest"; // for Vitest
// OR
import "@testing-library/jest-dom";         // for Jest
```

For Vitest, add jsdom environment:

```bash
npm install -D jsdom
```

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

### Rendering and Querying

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renders login form fields", () => {
    render(<LoginForm onSubmit={() => {}} />);

    // Priority order for queries (use the most accessible first):
    // 1. getByRole — best for accessible elements
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();

    // 2. getByLabelText — for form fields
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // 3. getByPlaceholderText — less preferred but useful
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();

    // 4. getByText — for non-interactive elements
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();

    // 5. getByTestId — last resort, when no better query exists
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });
});
```

### User Interactions

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("LoginForm", () => {
  it("submits the form with email and password", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    // Type into fields
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // Click submit
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "password123",
    });
  });

  it("shows validation error for empty email", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it("handles keyboard interactions", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={() => {}} />);

    // Tab through elements
    await user.tab();
    expect(screen.getByLabelText(/email/i)).toHaveFocus();

    // Type and press Enter
    await user.type(screen.getByLabelText(/email/i), "test@example.com{enter}");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={() => {}} />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
```

### Async Queries — waitFor and findBy

```tsx
import { render, screen, waitFor } from "@testing-library/react";

describe("UserProfile", () => {
  it("loads and displays user data", async () => {
    render(<UserProfile userId="1" />);

    // findBy* queries — wait for element to appear (combines getBy + waitFor)
    const userName = await screen.findByText("Alice");
    expect(userName).toBeInTheDocument();

    // waitFor — wait for assertion to pass
    await waitFor(() => {
      expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
    });

    // waitFor with custom timeout
    await waitFor(
      () => {
        expect(screen.getByText("Loaded")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("shows loading state then content", async () => {
    render(<UserProfile userId="1" />);

    // Loading state appears immediately
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Content replaces loading
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows error state", async () => {
    // Mock API to return error
    server.use(
      http.get("/api/users/:id", () => {
        return HttpResponse.json({ error: "Not found" }, { status: 404 });
      })
    );

    render(<UserProfile userId="invalid" />);

    await screen.findByText(/user not found/i);
  });
});
```

### Query Variants

```tsx
// getBy* — throws if not found (use for elements that SHOULD exist)
screen.getByRole("button", { name: /submit/i });

// queryBy* — returns null if not found (use for asserting absence)
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();

// findBy* — async, waits for element (use for elements that appear after async ops)
await screen.findByText("Loaded");

// getAllBy* / queryAllBy* / findAllBy* — multiple elements
const items = screen.getAllByRole("listitem");
expect(items).toHaveLength(3);
```

### Testing Hooks with renderHook

```tsx
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("initializes with custom value", () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it("increments counter", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("resets counter", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
    });
    expect(result.current.count).toBe(7);

    act(() => {
      result.current.reset();
    });
    expect(result.current.count).toBe(5);
  });
});
```

### Providing Context / Wrappers

```tsx
import { render } from "@testing-library/react";
import { ThemeProvider } from "./ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Custom render with providers
function renderWithProviders(
  ui: React.ReactElement,
  options?: { theme?: "light" | "dark" }
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={options?.theme ?? "light"}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

// Usage in tests
it("renders with dark theme", () => {
  renderWithProviders(<MyComponent />, { theme: "dark" });
  expect(screen.getByTestId("container")).toHaveClass("dark");
});
```

## 4. Playwright (E2E Testing)

### Setup

```bash
npm init playwright@latest
# OR
npm install -D @playwright/test
npx playwright install
```

### Configuration

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // fail CI if test.only is left in
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "on-failure" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  // Start dev server before running tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Writing Tests

```ts
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/My App/);
  });

  test("navigates to about page", async ({ page }) => {
    await page.getByRole("link", { name: /about/i }).click();
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("heading", { name: /about us/i })).toBeVisible();
  });

  test("displays hero section", async ({ page }) => {
    const hero = page.getByTestId("hero-section");
    await expect(hero).toBeVisible();
    await expect(hero.getByRole("heading")).toContainText("Welcome");
  });
});
```

### Locators

```ts
// Preferred locators (accessibility-first)
page.getByRole("button", { name: /submit/i });
page.getByRole("link", { name: "Home" });
page.getByRole("textbox", { name: /email/i });
page.getByRole("checkbox", { name: /agree/i });
page.getByRole("heading", { level: 1 });

page.getByLabel("Email");
page.getByPlaceholder("Enter your email");
page.getByText("Welcome back");
page.getByAltText("Company logo");

// CSS/XPath selectors (less preferred)
page.locator(".submit-btn");
page.locator('[data-testid="user-card"]');
page.locator("article >> h2");

// Filtering and chaining
page.getByRole("listitem").filter({ hasText: "Product 1" });
page.getByRole("listitem").nth(2);
page.locator("article").filter({ has: page.getByRole("heading", { name: "Featured" }) });
```

### Form Testing

```ts
test("submits contact form", async ({ page }) => {
  await page.goto("/contact");

  await page.getByLabel("Name").fill("Alice");
  await page.getByLabel("Email").fill("alice@example.com");
  await page.getByLabel("Message").fill("Hello, I have a question.");
  await page.getByRole("combobox", { name: /category/i }).selectOption("support");
  await page.getByRole("checkbox", { name: /agree to terms/i }).check();
  await page.getByRole("button", { name: /send message/i }).click();

  await expect(page.getByText(/thank you/i)).toBeVisible();
});
```

### Assertions

```ts
// Page assertions
await expect(page).toHaveTitle(/Dashboard/);
await expect(page).toHaveURL("/dashboard");

// Locator assertions
await expect(page.getByRole("button")).toBeVisible();
await expect(page.getByRole("button")).toBeEnabled();
await expect(page.getByRole("button")).toBeDisabled();
await expect(page.getByRole("textbox")).toHaveValue("hello");
await expect(page.getByRole("textbox")).toBeEmpty();
await expect(page.getByTestId("card")).toHaveClass(/highlighted/);
await expect(page.getByTestId("card")).toHaveCSS("color", "rgb(255, 0, 0)");
await expect(page.getByTestId("card")).toHaveAttribute("data-active", "true");
await expect(page.getByRole("list")).toHaveCount(5);
await expect(page.getByText("Error")).not.toBeVisible();
```

### Screenshots and Visual Testing

```ts
test("visual regression test", async ({ page }) => {
  await page.goto("/dashboard");

  // Full page screenshot
  await expect(page).toHaveScreenshot("dashboard.png", {
    maxDiffPixelRatio: 0.01,
  });

  // Element screenshot
  await expect(page.getByTestId("chart")).toHaveScreenshot("chart.png");

  // Manual screenshot capture
  await page.screenshot({ path: "screenshots/dashboard.png", fullPage: true });
});
```

### API Testing with Playwright

```ts
test("API returns user data", async ({ request }) => {
  const response = await request.get("/api/users/1");
  expect(response.ok()).toBeTruthy();

  const user = await response.json();
  expect(user).toEqual(
    expect.objectContaining({
      id: "1",
      name: "Alice",
    })
  );
});

test("API creates a new user", async ({ request }) => {
  const response = await request.post("/api/users", {
    data: { name: "Bob", email: "bob@example.com" },
  });
  expect(response.status()).toBe(201);
});
```

### Fixtures

```ts
// e2e/fixtures.ts
import { test as base, expect } from "@playwright/test";

type TestFixtures = {
  authenticatedPage: import("@playwright/test").Page;
  testUser: { email: string; password: string };
};

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const user = { email: "test@example.com", password: "password123" };
    // Could create user via API here
    await use(user);
    // Cleanup after test
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/dashboard");
    await use(page);
  },
});

export { expect };
```

```ts
// e2e/dashboard.spec.ts
import { test, expect } from "./fixtures";

test("authenticated user sees dashboard", async ({ authenticatedPage }) => {
  await expect(authenticatedPage.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});
```

### Parallel Execution and Test Isolation

```ts
// Tests run in parallel by default. Each test gets its own BrowserContext.
// Use test.describe.serial for tests that must run in order:
test.describe.serial("checkout flow", () => {
  test("add item to cart", async ({ page }) => {
    // ...
  });

  test("complete checkout", async ({ page }) => {
    // ...
  });
});

// Configure parallelism
test.describe.configure({ mode: "parallel" }); // default
test.describe.configure({ mode: "serial" });
```

## 5. Testing Patterns

### Arrange / Act / Assert

```ts
it("calculates total price with discount", () => {
  // Arrange
  const items = [
    { name: "Widget", price: 10, quantity: 2 },
    { name: "Gadget", price: 25, quantity: 1 },
  ];
  const discount = 0.1;

  // Act
  const total = calculateTotal(items, discount);

  // Assert
  expect(total).toBe(40.5); // (20 + 25) * 0.9
});
```

### Test Isolation

```ts
describe("UserService", () => {
  let service: UserService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    // Fresh instances for each test — no shared state
    mockDb = createMockDatabase();
    service = new UserService(mockDb);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a user", async () => {
    const user = await service.create({ name: "Alice", email: "alice@test.com" });
    expect(user.id).toBeDefined();
    expect(mockDb.users).toHaveLength(1);
  });

  it("starts with empty database", async () => {
    // This test is not affected by the previous one
    const users = await service.findAll();
    expect(users).toHaveLength(0);
  });
});
```

### Mocking Fetch / API Calls

```ts
// Option 1: Mock global fetch directly
describe("fetchUsers", () => {
  it("returns parsed users", async () => {
    const mockUsers = [{ id: "1", name: "Alice" }];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    });

    const users = await fetchUsers();
    expect(users).toEqual(mockUsers);
    expect(fetch).toHaveBeenCalledWith("/api/users");
  });

  it("throws on HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(fetchUsers()).rejects.toThrow("Failed to fetch users");
  });
});
```

### MSW (Mock Service Worker)

MSW intercepts network requests at the service worker level — works with any HTTP client (fetch, axios, etc.):

```bash
npm install -D msw
```

```ts
// src/test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
  }),

  http.get("/api/users/:id", ({ params }) => {
    const { id } = params;
    if (id === "999") {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ id, name: "Alice" });
  }),

  http.post("/api/users", async ({ request }) => {
    const body = await request.json() as { name: string; email: string };
    return HttpResponse.json({ id: "3", ...body }, { status: 201 });
  }),

  http.delete("/api/users/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

```ts
// src/test/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

```ts
// src/test/setup.ts
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```ts
// Override handlers in specific tests
import { server } from "../test/mocks/server";
import { http, HttpResponse } from "msw";

it("handles server error", async () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json({ error: "Server error" }, { status: 500 });
    })
  );

  render(<UserList />);
  await screen.findByText(/something went wrong/i);
});
```

### Testing Error Boundaries

```tsx
// ErrorBoundary.test.tsx
import { render, screen } from "@testing-library/react";

function ProblemChild(): JSX.Element {
  throw new Error("Test error");
}

describe("ErrorBoundary", () => {
  // Suppress React error boundary console.error in test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("renders fallback UI on error", () => {
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <div>Working fine</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Working fine")).toBeInTheDocument();
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });
});
```

### Testing Form Submissions (with React Hook Form)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ContactForm", () => {
  it("submits valid form data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "alice@test.com");
    await user.type(screen.getByLabelText(/message/i), "Hello there");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alice",
          email: "alice@test.com",
          message: "Hello there",
        })
      );
    });
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await screen.findByText(/name is required/i);
    await screen.findByText(/email is required/i);
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={() => {}} />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await screen.findByText(/invalid email/i);
  });
});
```

## 6. API Testing

### Testing Route Handlers (Next.js)

```ts
// app/api/users/route.test.ts
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

describe("GET /api/users", () => {
  it("returns a list of users", async () => {
    const request = new NextRequest("http://localhost:3000/api/users");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
      ])
    );
  });

  it("supports pagination", async () => {
    const request = new NextRequest("http://localhost:3000/api/users?page=2&limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveLength(10);
  });
});

describe("POST /api/users", () => {
  it("creates a new user", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", email: "alice@test.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({ name: "Alice", email: "alice@test.com" });
    expect(data.id).toBeDefined();
  });

  it("returns 400 for invalid body", async () => {
    const request = new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### Testing Express Endpoints with Supertest

```bash
npm install -D supertest @types/supertest
```

```ts
// Separate app creation from server.listen for testability
// src/app.ts
import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users/:id", async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

export default app;
```

```ts
// src/app.test.ts
import request from "supertest";
import app from "./app";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/users/:id", () => {
  it("returns user by id", async () => {
    const response = await request(app).get("/api/users/1");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: "1", name: "Alice" });
  });

  it("returns 404 for non-existent user", async () => {
    const response = await request(app).get("/api/users/999");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Not found" });
  });
});

describe("POST /api/users", () => {
  it("creates a user and returns 201", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ name: "Bob", email: "bob@test.com" })
      .set("Authorization", "Bearer test-token")
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body.name).toBe("Bob");
  });
});
```

### Testing with Test Containers (Real Database)

```bash
npm install -D testcontainers
```

```ts
// src/test/db-setup.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

export async function setupTestDb() {
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("testdb")
    .start();

  const databaseUrl = container.getConnectionUri();

  // Run migrations
  execSync(`DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await prisma.$connect();

  return { prisma, databaseUrl };
}

export async function teardownTestDb() {
  await prisma?.$disconnect();
  await container?.stop();
}
```

```ts
// src/services/user-service.integration.test.ts
import { setupTestDb, teardownTestDb } from "../test/db-setup";
import { UserService } from "./user-service";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let userService: UserService;

beforeAll(async () => {
  const db = await setupTestDb();
  prisma = db.prisma;
  userService = new UserService(prisma);
}, 60_000); // Container startup can take time

afterAll(async () => {
  await teardownTestDb();
});

afterEach(async () => {
  // Clean tables between tests
  await prisma.user.deleteMany();
});

describe("UserService (integration)", () => {
  it("creates and retrieves a user", async () => {
    const created = await userService.create({ name: "Alice", email: "alice@test.com" });
    const found = await userService.findById(created.id);

    expect(found).toMatchObject({ name: "Alice", email: "alice@test.com" });
  });

  it("enforces unique email constraint", async () => {
    await userService.create({ name: "Alice", email: "alice@test.com" });

    await expect(
      userService.create({ name: "Bob", email: "alice@test.com" })
    ).rejects.toThrow(/unique constraint/i);
  });
});
```

### Testing Webhooks

```ts
// src/webhooks/stripe.test.ts
import request from "supertest";
import Stripe from "stripe";
import app from "../app";

describe("POST /webhooks/stripe", () => {
  const stripe = new Stripe("sk_test_xxx", { apiVersion: "2024-06-20" });

  function createWebhookEvent(type: string, data: Record<string, unknown>) {
    return {
      id: "evt_test_123",
      type,
      data: { object: data },
      created: Math.floor(Date.now() / 1000),
    };
  }

  it("handles checkout.session.completed", async () => {
    const event = createWebhookEvent("checkout.session.completed", {
      id: "cs_test_123",
      customer: "cus_123",
      subscription: "sub_123",
      metadata: { userId: "user_1" },
    });

    const response = await request(app)
      .post("/webhooks/stripe")
      .send(event)
      .set("stripe-signature", "test_signature");

    expect(response.status).toBe(200);
    // Verify side effects: user subscription updated, email sent, etc.
  });

  it("returns 400 for unhandled event types", async () => {
    const event = createWebhookEvent("unknown.event", {});

    const response = await request(app)
      .post("/webhooks/stripe")
      .send(event)
      .set("stripe-signature", "test_signature");

    expect(response.status).toBe(400);
  });
});
```

## 7. Code Coverage

### Vitest Coverage

```bash
# Run with coverage
vitest run --coverage

# Coverage with specific reporter
vitest run --coverage --coverage.reporter=text --coverage.reporter=html
```

`vitest.config.ts` coverage config:

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8", // or "istanbul"
      reporter: ["text", "html", "lcov", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/**/*.d.ts",
        "src/test/**",
        "src/types/**",
        "src/**/index.ts", // barrel files
      ],
      thresholds: {
        // Fail if coverage drops below these
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      // Per-file thresholds
      // thresholds: { "src/critical/**": { lines: 95 } },
    },
  },
});
```

### Jest Coverage

```bash
jest --coverage
jest --coverage --coverageReporters="text" --coverageReporters="lcov"
```

### v8 vs Istanbul

- **v8** — uses V8's built-in coverage. Faster, works with native ESM, lower overhead. Preferred for Vitest.
- **istanbul** — instrument-based coverage. More mature, works everywhere, better branch detection in some edge cases. Still default for Jest (via `babel-plugin-istanbul`).

Use v8 for Vitest. Use istanbul (default) for Jest unless you have a specific reason to change.

### Ignoring Coverage

```ts
/* v8 ignore next */
if (process.env.NODE_ENV === "development") {
  enableDebugMode();
}

/* v8 ignore start */
function debugOnlyHelper() {
  // This entire function is excluded from coverage
}
/* v8 ignore stop */

// Istanbul style (for Jest)
/* istanbul ignore next */
if (process.env.DEBUG) {
  console.log("debug info");
}
```

## 8. CI Integration

### GitHub Actions — Unit Tests

```yaml
# .github/workflows/test.yml
name: Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci
      - run: npm run test:ci

      # Upload coverage to Codecov (optional)
      - uses: codecov/codecov-action@v4
        if: always()
        with:
          file: ./coverage/lcov.info
          token: ${{ secrets.CODECOV_TOKEN }}
```

### GitHub Actions — Playwright

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: npx playwright test --project=chromium --reporter=github --reporter=html
        env:
          CI: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Caching and Parallelization

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci

      # Vitest sharding
      - run: npx vitest run --shard=${{ matrix.shard }}/4

      # OR Playwright sharding
      - run: npx playwright test --shard=${{ matrix.shard }}/4
```

## 9. Test Organization

### File Naming Conventions

```
# Option A: Co-located tests (recommended)
src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx       # Unit test next to component
│   ├── LoginForm.tsx
│   └── LoginForm.test.tsx
├── services/
│   ├── user-service.ts
│   └── user-service.test.ts
├── utils/
│   ├── format.ts
│   └── format.test.ts

# Option B: __tests__ directories
src/
├── components/
│   ├── __tests__/
│   │   ├── Button.test.tsx
│   │   └── LoginForm.test.tsx
│   ├── Button.tsx
│   └── LoginForm.tsx

# E2E tests: always separate directory
e2e/
├── auth.spec.ts
├── checkout.spec.ts
├── fixtures.ts
└── helpers/
    └── test-utils.ts
```

Convention: `.test.ts` for unit/integration, `.spec.ts` for e2e. Be consistent within a project.

### Test Factories and Builders

```ts
// src/test/factories.ts
import { faker } from "@faker-js/faker";

// Simple factory function
export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "user",
    createdAt: new Date(),
    ...overrides,
  };
}

export function createPost(overrides?: Partial<Post>): Post {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    authorId: faker.string.uuid(),
    published: false,
    createdAt: new Date(),
    ...overrides,
  };
}

// Builder pattern for complex objects
export class UserBuilder {
  private user: User;

  constructor() {
    this.user = createUser();
  }

  withRole(role: "admin" | "user" | "moderator") {
    this.user.role = role;
    return this;
  }

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  asAdmin() {
    this.user.role = "admin";
    return this;
  }

  build(): User {
    return { ...this.user };
  }
}

// Usage in tests
it("admin can delete users", async () => {
  const admin = new UserBuilder().asAdmin().build();
  const targetUser = createUser();

  const result = await userService.deleteUser(admin, targetUser.id);
  expect(result.success).toBe(true);
});
```

### Test Fixtures

```ts
// src/test/fixtures/users.ts
export const fixtures = {
  validUser: {
    name: "Alice Smith",
    email: "alice@example.com",
    password: "SecureP@ss123",
  },
  adminUser: {
    name: "Admin User",
    email: "admin@example.com",
    password: "AdminP@ss123",
    role: "admin" as const,
  },
  invalidEmails: [
    "",
    "not-an-email",
    "@missing-local.com",
    "missing-domain@",
    "spaces in@email.com",
  ],
} as const;
```

## 10. Common Gotchas

### act() Warnings

```tsx
// ❌ This causes act() warning — state update happens outside act()
it("loads data", async () => {
  render(<UserProfile userId="1" />);
  // Component fetches data and updates state, but we're not waiting for it
  expect(screen.getByText("Alice")).toBeInTheDocument();
});

// ✅ Fix: use findBy (waits for element) or waitFor
it("loads data", async () => {
  render(<UserProfile userId="1" />);
  expect(await screen.findByText("Alice")).toBeInTheDocument();
});

// ✅ Fix: wrap state updates in act() when testing hooks
import { renderHook, act } from "@testing-library/react";

it("updates state", () => {
  const { result } = renderHook(() => useState(0));

  act(() => {
    result.current[1](5); // setState
  });

  expect(result.current[0]).toBe(5);
});
```

### Cleanup

```ts
// React Testing Library auto-cleans after each test (if using afterEach cleanup).
// But if you use custom render or manual DOM manipulation:
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup(); // Usually automatic — only needed if auto-cleanup is disabled
});

// Timer cleanup
afterEach(() => {
  vi.useRealTimers(); // Always restore real timers
});

// Mock cleanup
afterEach(() => {
  vi.restoreAllMocks(); // Restore all mocks, spies, and stubs
  // vi.clearAllMocks();  — clears call history but keeps implementation
  // vi.resetAllMocks();  — resets implementation to vi.fn() (no return value)
});
```

### ESM Module Mocking

```ts
// Vitest handles ESM natively — vi.mock works with ESM modules.

// ⚠️ Jest requires extra config for ESM
// jest.config.ts
export default {
  transform: {},
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

// For Jest with ESM, use jest.unstable_mockModule instead of jest.mock:
jest.unstable_mockModule("./module.js", () => ({
  myFunction: jest.fn(),
}));

// Must use dynamic import AFTER the mock declaration
const { myFunction } = await import("./module.js");
```

### Testing Next.js Server Components

```tsx
// Server Components can be tested by calling them as async functions.
// They return JSX, which you can render.

// app/page.tsx
export default async function HomePage() {
  const posts = await db.post.findMany();
  return (
    <div>
      <h1>Blog</h1>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}

// app/page.test.tsx
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    post: {
      findMany: vi.fn().mockResolvedValue([
        { id: "1", title: "First Post" },
        { id: "2", title: "Second Post" },
      ]),
    },
  },
}));

it("renders blog posts", async () => {
  // Call the Server Component as an async function, await its JSX
  const jsx = await HomePage();
  render(jsx);

  expect(screen.getByText("First Post")).toBeInTheDocument();
  expect(screen.getByText("Second Post")).toBeInTheDocument();
});
```

### Testing Server Actions

```ts
// app/actions.ts
"use server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title) throw new Error("Title is required");

  await db.post.create({ data: { title } });
  revalidatePath("/blog");
}

// app/actions.test.ts
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { post: { create: vi.fn() } },
}));

import { createPost } from "./actions";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

it("creates a post and revalidates", async () => {
  const formData = new FormData();
  formData.set("title", "New Post");

  await createPost(formData);

  expect(db.post.create).toHaveBeenCalledWith({ data: { title: "New Post" } });
  expect(revalidatePath).toHaveBeenCalledWith("/blog");
});

it("throws for empty title", async () => {
  const formData = new FormData();
  formData.set("title", "");

  await expect(createPost(formData)).rejects.toThrow("Title is required");
});
```

### Testing Environment Variables

```ts
// Option 1: vi.stubEnv (Vitest 1.0+)
it("uses production API URL in production", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("API_URL", "https://api.example.com");

  expect(getApiUrl()).toBe("https://api.example.com");

  vi.unstubAllEnvs();
});

// Option 2: Manual save/restore
describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reads DATABASE_URL from env", () => {
    process.env.DATABASE_URL = "postgres://test:5432/testdb";
    expect(getDbConfig().url).toBe("postgres://test:5432/testdb");
  });

  it("throws if DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => getDbConfig()).toThrow("DATABASE_URL is required");
  });
});
```

### Timer Gotchas

```ts
// ❌ Don't mix real and fake timers carelessly
it("broken test", async () => {
  vi.useFakeTimers();
  const result = fetchWithTimeout("/api/data", 5000); // Uses real network + fake timers
  vi.advanceTimersByTime(5000); // This won't work as expected with real async operations
});

// ✅ When testing timers with async operations, advance timers and await
it("times out after 5 seconds", async () => {
  vi.useFakeTimers();
  const promise = fetchWithTimeout("/api/data", 5000);

  // Advance timers and flush microtasks
  await vi.advanceTimersByTimeAsync(5000);

  await expect(promise).rejects.toThrow("Request timed out");
  vi.useRealTimers();
});
```

## Key Gotchas Summary

- Always use `userEvent.setup()` before interactions — do NOT use the legacy `userEvent.click()` directly.
- Prefer `getByRole` over `getByTestId`. Only use `data-testid` as a last resort.
- `vi.mock()` / `jest.mock()` calls are hoisted — they run before imports. Don't reference variables from outer scope.
- Use `vi.restoreAllMocks()` in `afterEach` to prevent mock leakage between tests.
- For React Testing Library, `cleanup` is automatic with Vitest/Jest — don't call it manually unless you've disabled auto-cleanup.
- `findBy*` queries have a default timeout of 1000ms. Pass `{ timeout: 5000 }` for slow operations.
- Always separate your Express/Hono app from `server.listen()` so tests can import the app without starting a server.
- Set `retry: false` in React Query's test config to prevent confusing test behavior from automatic retries.
- In CI, always run Playwright with `--project=chromium` to avoid installing all browsers. Install with `--with-deps` for system dependencies.
- Use `test.describe.configure({ mode: "serial" })` in Playwright only when tests genuinely depend on each other. Prefer independent tests.
