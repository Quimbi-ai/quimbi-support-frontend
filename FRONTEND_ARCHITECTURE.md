# Quimbi Frontend - Architecture Definition

**Date**: December 1, 2025
**Purpose**: Define the responsibilities, current state, and target architecture for the Quimbi customer support frontend application

---

## System Overview

The Quimbi Frontend is a **React-based single-page application (SPA)** that provides a unified interface for customer support agents to handle tickets, view customer intelligence, and leverage AI-powered recommendations.

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Deployment**: Railway (production)

### What This Frontend IS
- **Customer Support Interface**: Primary UI for support agents
- **Intelligence Dashboard**: Displays customer behavioral insights
- **Ticket Management UI**: View, respond to, and manage support tickets
- **AI Recommendation Display**: Shows AI-generated suggestions and drafts
- **Demo Environment**: Includes demo mode for testing AI responses

### What This Frontend IS NOT
- ❌ Backend service (no business logic or data storage)
- ❌ Independent application (requires backend APIs)
- ❌ Multi-tenant admin portal (single tenant per deployment)
- ❌ Public-facing customer portal (agent-only interface)

---

## Current Architecture State

### API Dependencies (As of December 2025)

The frontend currently calls a **monolithic backend** that combines multiple concerns:

```
Frontend → Single Backend API
           (ecommerce-backend-staging-a14c.up.railway.app)
           │
           ├── Ticketing endpoints (/api/tickets/*)
           ├── AI endpoints (/api/ai/*)
           ├── Customer intelligence (/api/mcp/customer/*)
           └── System endpoints (/health, /openapi.json)
```

#### Current Backend URL
```
Production: https://ecommerce-backend-staging-a14c.up.railway.app
Local Dev:  http://localhost:8000 (optional)
```

**Configuration**: `.env.local`
```bash
VITE_API_BASE_URL=https://ecommerce-backend-staging-a14c.up.railway.app
VITE_API_KEY=e340256ddd65ab5d9643762f62eea44d7dfb95df32685e31
```

### Current API Modules

#### 1. Tickets API (`src/api/tickets.ts`)

**Endpoints Called:**
```typescript
GET    /api/tickets                        // List tickets with filtering
GET    /api/tickets/{id}                   // Get ticket details
POST   /api/tickets                        // Create new ticket
PATCH  /api/tickets/{id}                   // Update ticket metadata
POST   /api/tickets/{id}/messages          // Send message/reply
POST   /api/tickets/{id}/notes             // Add internal note
GET    /api/tickets/{id}/notes             // Get internal notes
POST   /api/tickets/{id}/reset-conversation // Demo: Reset ticket messages
```

**Current Behavior:**
- Ticket list requests include `smart_order=true` for AI-powered prioritization
- Messages are stored on backend and persist across page refreshes
- Demo mode uses real backend storage (not frontend-only)

**Data Received:**
- Ticket metadata (subject, status, priority, channel, tags)
- Full message history with timestamps and authors
- Customer profile (embedded in ticket response)
- Smart score and topic alert matches

#### 2. AI API (`src/api/ai.ts`)

**Endpoints Called:**
```typescript
GET  /api/ai/tickets/{id}/recommendation        // Get next best actions
GET  /api/ai/tickets/{id}/draft-response        // Get AI draft reply
POST /api/ai/tickets/{id}/draft-response/regenerate // Regenerate draft
PATCH /api/ai/tickets/{id}/recommendation/actions/{index} // Mark action complete
```

**Current Behavior:**
- Draft responses are cached on backend
- Regenerate draft invalidates cache and generates new response
- Recommendations include reasoning and estimated impact
- Actions can be marked as completed

**Data Received:**
- AI-generated draft response text
- Next best action recommendations (prioritized list)
- Talking points and warnings
- Personalization metadata (tone, length, applied strategies)

#### 3. Customer API (`src/api/customers.ts`)

**Endpoints Called:**
```typescript
GET /api/mcp/customer/random                  // Demo: Get random customer
GET /api/mcp/customer/{id}                    // Get customer profile
GET /api/mcp/customer/{id}/churn-risk         // Get churn risk details
GET /api/mcp/customer/{id}/orders             // Get order history
```

**Current Behavior:**
- Customer profile includes behavioral segmentation
- Churn risk provides detailed risk factors
- Order history supports date range filtering

**Data Received:**
- Customer archetype (id, level, dominant segments)
- Business metrics (LTV, total orders, AOV, tenure)
- Churn risk score and factors
- Segment memberships (fuzzy scores for each segment)
- Order history with line items

#### 4. System API (`src/api/system.ts`)

**Endpoints Called:**
```typescript
GET /health                // Health check
GET /openapi.json          // API documentation
```

---

## Current Data Flow

### 1. Ticket List View (`InboxPage.tsx`)

```
User visits /inbox
    ↓
Frontend: GET /api/tickets?smart_order=true&status=open
    ↓
Backend: Returns list of tickets with smart scores
    ↓
Frontend: Displays sorted ticket list
    ↓
User clicks ticket
    ↓
Navigate to /tickets/{id}
```

**Current Issues:**
- Backend includes customer profile in ticket list (inefficient)
- Smart ordering happens on backend (not configurable from frontend)
- Topic alerts are mixed with ticket filtering logic

### 2. Ticket Detail View (`TicketDetailPage.tsx`)

```
User opens /tickets/{id}
    ↓
Frontend: Parallel requests:
  ├─ GET /api/tickets/{id}              → Ticket + messages + customer_profile
  └─ GET /api/ai/tickets/{id}/draft-response → AI draft
    ↓
Frontend: Displays ticket conversation + customer sidebar + AI draft
    ↓
User types demo message
    ↓
Frontend: POST /api/tickets/{id}/messages (customer message)
    ↓
Frontend: POST /api/ai/tickets/{id}/draft-response/regenerate
    ↓
Frontend: POST /api/tickets/{id}/messages (AI response, split into chunks)
    ↓
Frontend: Refetch ticket to show new messages
```

**Current Issues:**
- Customer profile is embedded in ticket response (not reusable)
- AI draft is separate request (could be batched)
- Demo messages persist to backend (should be frontend-only option)
- Message sending doesn't support optimistic updates

### 3. Customer Profile Sidebar

```
Ticket loaded with customer_profile included
    ↓
Frontend: Displays:
  ├─ Archetype ID and level
  ├─ Business metrics (LTV, orders, AOV)
  ├─ Churn risk score
  ├─ Dominant segments (8 behavioral axes)
  └─ Key behavior badges
```

**Data Source:**
- Currently embedded in `GET /api/tickets/{id}` response
- No way to refresh customer data independently
- No API to get just customer profile without ticket context

### 4. AI Recommendations

```
Frontend: GET /api/ai/tickets/{id}/recommendation
    ↓
Backend: Returns next best actions based on:
  ├─ Customer archetype
  ├─ Churn risk
  ├─ Purchase history
  ├─ Ticket sentiment
  └─ Recent interactions
    ↓
Frontend: Displays prioritized action list
    ↓
User clicks action checkbox
    ↓
Frontend: PATCH /api/ai/tickets/{id}/recommendation/actions/{index}
```

**Current Issues:**
- Recommendations generated on-demand (not cached)
- No way to force refresh recommendations
- Action completion tracking lives on backend (not ticket metadata)

---

## Current Pages & Components

### Pages

1. **`InboxPage.tsx`** - Ticket list with filtering and smart ordering
2. **`TicketDetailPage.tsx`** - Full ticket view with customer profile and AI tools
3. **`CustomerPage.tsx`** - Standalone customer profile view (not integrated with tickets)
4. **`AnalyticsPage.tsx`** - Dashboard with metrics (placeholder)
5. **`DemoPage.tsx`** - Testing/demo interface

### Key Components

**Ticket Components:**
- Ticket list with status badges
- Message thread display
- Message composer with send options
- Internal note panel

**Customer Profile Components:**
- Archetype badge and description
- Business metrics cards (LTV, orders, churn)
- Segment membership visualization
- Dominant behavior badges

**AI Components:**
- Next best action checklist
- Draft response editor
- Tone/length selector for regeneration
- Recommendation reasoning display

---

## Problems with Current Architecture

### 1. **Monolithic Backend Dependency**

**Problem:**
Frontend calls a single backend that handles:
- Ticketing operations (CRUD)
- Customer intelligence (ML/AI)
- AI content generation
- Analytics aggregation

**Impact:**
- Cannot independently scale intelligence vs. ticketing
- Backend changes affect all frontend functionality
- Difficult to swap out components (e.g., use different ticketing system)

### 2. **Embedded Customer Profiles**

**Problem:**
Customer profile is embedded in ticket response, not fetched separately.

**Impact:**
- Wasteful: Re-fetches customer data for every ticket view
- Not reusable: Can't display customer profile without ticket context
- Stale data: Customer profile doesn't update independently

**Example:**
```typescript
// Current: Customer profile comes with ticket
GET /api/tickets/123 → {
  ticket: {...},
  messages: [...],
  customer_profile: {...}  // Embedded, not separate
}

// Desired: Separate requests
GET /api/tickets/123 → { ticket: {...}, messages: [...] }
GET /api/customers/456 → { customer_profile: {...} }
```

### 3. **No Demo vs. Production Mode**

**Problem:**
Demo messages are stored in backend database, creating clutter.

**Impact:**
- Demo tickets accumulate in production database
- No easy way to distinguish demo vs. real tickets
- Reset button deletes real data (dangerous)

**Desired:**
- Frontend-only demo mode (messages stored in React state)
- Optional backend persistence for demos
- Clear visual distinction between demo and production

### 4. **AI Draft Caching**

**Problem:**
AI drafts are cached on backend, not frontend.

**Impact:**
- Cache-busting required (`?_t=timestamp`)
- No way to invalidate cache from frontend
- Regenerate doesn't always trigger new draft

**Desired:**
- Frontend controls caching behavior
- Backend is stateless for draft generation
- Clear cache invalidation on message send

### 5. **Mixed Responsibilities**

**Problem:**
Backend handles both:
- Operational data (tickets, messages, notes)
- Intelligence data (profiles, segments, recommendations)

**Impact:**
- Tight coupling between systems
- Cannot replace ticketing system without affecting intelligence
- Difficult to test components independently

---

## Target Architecture (Microservices)

### Backend Separation

```
Frontend
  │
  ├─→ Support Backend (Ticketing/CRM)
  │   - Tickets, messages, notes
  │   - Agent assignments, SLAs
  │   - Customer contact data
  │
  ├─→ Quimbi Intelligence Backend (AI/ML)
  │   - Customer profiles
  │   - Segmentation
  │   - Churn predictions
  │   - AI draft generation
  │   - Recommendations
  │
  └─→ Analytics Backend (optional future)
      - Dashboards, reports
      - Trend analysis
```

### Proposed Frontend API Structure

#### Support Backend APIs (New Service)

```typescript
// Ticketing
GET    /api/tickets                       // List tickets
GET    /api/tickets/{id}                  // Get ticket (no customer profile)
POST   /api/tickets                       // Create ticket
PATCH  /api/tickets/{id}                  // Update ticket
DELETE /api/tickets/{id}                  // Delete ticket (admin only)

// Messages
GET    /api/tickets/{id}/messages         // Get messages
POST   /api/tickets/{id}/messages         // Send message
PATCH  /api/tickets/{id}/messages/{msg_id} // Edit message
DELETE /api/tickets/{id}/messages/{msg_id} // Delete message

// Notes
GET    /api/tickets/{id}/notes            // Get internal notes
POST   /api/tickets/{id}/notes            // Add note

// Assignments & Routing
PATCH  /api/tickets/{id}/assign           // Assign to agent
GET    /api/queues                        // Get ticket queues
POST   /api/tickets/{id}/transfer         // Transfer to queue

// Demo Mode (NEW)
POST   /api/tickets/{id}/demo/messages    // Add demo message (temporary)
POST   /api/tickets/{id}/demo/reset       // Reset demo state
```

#### Quimbi Intelligence Backend APIs (Updated)

```typescript
// Customer Intelligence
GET  /api/intelligence/customer/{id}       // Full customer profile
GET  /api/intelligence/customer/{id}/churn // Churn risk details
GET  /api/intelligence/customer/{id}/ltv   // LTV prediction
POST /api/intelligence/batch-analyze       // Bulk customer analysis

// Segmentation
GET  /api/segments/definitions             // All segment definitions
GET  /api/segments/customer/{id}           // Customer's segments
POST /api/segments/query                   // Query customers by segment

// Archetypes
GET  /api/archetypes/definitions           // All archetypes
GET  /api/archetypes/{archetype_id}        // Archetype details
GET  /api/archetypes/top                   // Top archetypes by population

// AI Generation (Stateless)
POST /api/generation/draft-response        // Generate draft (no caching)
  Body: { ticket_id, customer_id, context, tone, length }

POST /api/generation/recommendations       // Generate recommendations
  Body: { ticket_id, customer_id, context }

POST /api/generation/summary               // Summarize customer behavior
  Body: { customer_id }

// Analytics
GET  /api/analytics/churn-trends           // Churn trends over time
GET  /api/analytics/segment-distribution   // Customer distribution
GET  /api/analytics/cohorts                // Cohort analysis
```

### Frontend Changes Required

#### 1. **Dual API Clients**

Create separate API clients for each backend:

```typescript
// src/lib/support-api-client.ts
const SUPPORT_API_URL = import.meta.env.VITE_SUPPORT_API_URL;
export const supportApi = new ApiClient(SUPPORT_API_URL);

// src/lib/intelligence-api-client.ts
const INTELLIGENCE_API_URL = import.meta.env.VITE_INTELLIGENCE_API_URL;
export const intelligenceApi = new ApiClient(INTELLIGENCE_API_URL);
```

#### 2. **Separate API Modules**

```typescript
// src/api/tickets.ts (Support Backend)
export const ticketApi = {
  list: () => supportApi.get('/api/tickets'),
  getById: (id) => supportApi.get(`/api/tickets/${id}`),
  // ... other ticket operations
};

// src/api/customers.ts (Intelligence Backend)
export const customerApi = {
  getProfile: (id) => intelligenceApi.get(`/api/intelligence/customer/${id}`),
  getChurnRisk: (id) => intelligenceApi.get(`/api/intelligence/customer/${id}/churn`),
  // ... other intelligence operations
};

// src/api/ai.ts (Intelligence Backend)
export const aiApi = {
  generateDraft: (params) => intelligenceApi.post('/api/generation/draft-response', params),
  getRecommendations: (params) => intelligenceApi.post('/api/generation/recommendations', params),
  // ... other AI operations
};
```

#### 3. **Parallel Data Fetching**

```typescript
// TicketDetailPage.tsx
const { data: ticket } = useQuery(['ticket', ticketId], () =>
  ticketApi.getById(ticketId)  // Support Backend
);

const { data: customer } = useQuery(['customer', ticket?.customer_id], () =>
  customerApi.getProfile(ticket.customer_id),  // Intelligence Backend
  { enabled: !!ticket }
);

const { data: draft } = useQuery(['draft', ticketId, ticket?.customer_id], () =>
  aiApi.generateDraft({ ticket_id: ticketId, customer_id: ticket.customer_id }),  // Intelligence Backend
  { enabled: !!ticket }
);
```

#### 4. **Demo Mode (Frontend-Only)**

```typescript
// Use React state for demo messages
const [demoMode, setDemoMode] = useState(false);
const [demoMessages, setDemoMessages] = useState<Message[]>([]);

// When sending demo message:
if (demoMode) {
  // Store in local state only
  setDemoMessages([...demoMessages, newMessage]);
} else {
  // Persist to backend
  await ticketApi.sendMessage(ticketId, newMessage);
}
```

---

## Migration Plan

### Phase 1: Dual API Support (Backward Compatible)

**Goal**: Support both monolithic and microservices backends

**Changes:**
1. Add environment variables for multiple backend URLs
2. Create conditional API clients (monolithic vs. microservices)
3. Frontend works with either architecture
4. No breaking changes to existing deployments

**Implementation:**
```typescript
// .env.local
VITE_API_MODE=monolithic  // or 'microservices'
VITE_MONOLITHIC_API_URL=https://ecommerce-backend-staging-a14c.up.railway.app
VITE_SUPPORT_API_URL=https://support-backend.quimbi.com
VITE_INTELLIGENCE_API_URL=https://intelligence-backend.quimbi.com

// src/lib/api-factory.ts
export const getApiClients = () => {
  const mode = import.meta.env.VITE_API_MODE;

  if (mode === 'monolithic') {
    const baseUrl = import.meta.env.VITE_MONOLITHIC_API_URL;
    return {
      tickets: new ApiClient(baseUrl),
      intelligence: new ApiClient(baseUrl),
    };
  } else {
    return {
      tickets: new ApiClient(import.meta.env.VITE_SUPPORT_API_URL),
      intelligence: new ApiClient(import.meta.env.VITE_INTELLIGENCE_API_URL),
    };
  }
};
```

### Phase 2: Create Support Backend Adapter

**Goal**: Abstract Support Backend operations

**Changes:**
1. Create adapter layer for ticket operations
2. Adapter handles both old and new backend formats
3. Frontend code uses adapter, not direct API calls

**Implementation:**
```typescript
// src/adapters/ticket-adapter.ts
export class TicketAdapter {
  async getTicket(id: string) {
    if (config.apiMode === 'monolithic') {
      return legacyTicketApi.getById(id);
    } else {
      // Parallel fetch ticket + customer
      const [ticket, customer] = await Promise.all([
        supportApi.get(`/api/tickets/${id}`),
        intelligenceApi.get(`/api/intelligence/customer/${ticket.customer_id}`),
      ]);
      return { ...ticket, customer_profile: customer };
    }
  }
}
```

### Phase 3: Migrate Pages to Microservices

**Goal**: Update pages to use separate backends

**Order:**
1. CustomerPage (intelligence only)
2. AnalyticsPage (intelligence only)
3. InboxPage (support + intelligence for enrichment)
4. TicketDetailPage (support + intelligence)

### Phase 4: Remove Monolithic Support

**Goal**: Drop backward compatibility

**Changes:**
1. Remove `VITE_API_MODE` environment variable
2. Remove legacy API client code
3. All deployments use microservices architecture

---

## Environment Configuration

### Current (.env.local)

```bash
VITE_API_BASE_URL=https://ecommerce-backend-staging-a14c.up.railway.app
VITE_API_KEY=e340256ddd65ab5d9643762f62eea44d7dfb95df32685e31
```

### Target (Microservices)

```bash
# Support Backend (Ticketing/CRM)
VITE_SUPPORT_API_URL=https://support-backend.quimbi.com
VITE_SUPPORT_API_KEY=sk_support_abc123...

# Intelligence Backend (AI/ML)
VITE_INTELLIGENCE_API_URL=https://intelligence-backend.quimbi.com
VITE_INTELLIGENCE_API_KEY=sk_intelligence_xyz789...

# Optional: Analytics Backend
VITE_ANALYTICS_API_URL=https://analytics-backend.quimbi.com
VITE_ANALYTICS_API_KEY=sk_analytics_def456...

# Feature Flags
VITE_DEMO_MODE_ENABLED=true
VITE_AI_RECOMMENDATIONS_ENABLED=true
VITE_ADVANCED_ANALYTICS_ENABLED=false
```

---

## Data Types & Contracts

### Current TypeScript Types (`src/types/index.ts`)

The frontend defines its own types that mirror backend responses. These need to be:
1. **Versioned**: Add API version to type names (e.g., `TicketV1`, `CustomerProfileV1`)
2. **Validated**: Use runtime validation (Zod, io-ts) to ensure backend matches
3. **Documented**: Generate from OpenAPI specs when available

### Proposed Type Organization

```
src/types/
  ├── support/         # Support Backend types
  │   ├── ticket.ts
  │   ├── message.ts
  │   └── note.ts
  ├── intelligence/    # Intelligence Backend types
  │   ├── customer.ts
  │   ├── archetype.ts
  │   ├── segment.ts
  │   └── recommendation.ts
  └── common/          # Shared types
      ├── pagination.ts
      └── api.ts
```

---

## Performance Considerations

### Current Performance Issues

1. **Over-fetching**: Customer profile embedded in every ticket request
2. **No caching strategy**: React Query defaults used (5min stale time)
3. **Sequential requests**: Draft + recommendations fetched after ticket
4. **No optimistic updates**: UI waits for server confirmation

### Proposed Optimizations

#### 1. **Smart Caching**

```typescript
// Cache customer profiles longer than tickets
const { data: customer } = useQuery(
  ['customer', customerId],
  () => customerApi.getProfile(customerId),
  {
    staleTime: 1000 * 60 * 30,  // 30 minutes
    cacheTime: 1000 * 60 * 60,  // 1 hour
  }
);

// Cache tickets briefly
const { data: ticket } = useQuery(
  ['ticket', ticketId],
  () => ticketApi.getById(ticketId),
  {
    staleTime: 1000 * 10,  // 10 seconds
    cacheTime: 1000 * 60,  // 1 minute
  }
);
```

#### 2. **Parallel Fetching**

```typescript
// Fetch ticket and customer in parallel
const results = useQueries([
  { queryKey: ['ticket', ticketId], queryFn: () => ticketApi.getById(ticketId) },
  { queryKey: ['customer', customerId], queryFn: () => customerApi.getProfile(customerId), enabled: !!customerId },
  { queryKey: ['draft', ticketId], queryFn: () => aiApi.generateDraft({...}), enabled: !!ticketId },
]);
```

#### 3. **Optimistic Updates**

```typescript
// Update UI immediately, rollback on error
const sendMessage = useMutation(
  (message) => ticketApi.sendMessage(ticketId, message),
  {
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['ticket', ticketId]);

      // Snapshot previous value
      const previous = queryClient.getQueryData(['ticket', ticketId]);

      // Optimistically update UI
      queryClient.setQueryData(['ticket', ticketId], (old) => ({
        ...old,
        messages: [...old.messages, { ...newMessage, id: 'temp-' + Date.now() }],
      }));

      return { previous };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(['ticket', ticketId], context.previous);
    },
  }
);
```

#### 4. **Prefetching**

```typescript
// Prefetch next ticket in list
const prefetchNextTicket = (currentIndex: number) => {
  const nextTicket = tickets[currentIndex + 1];
  if (nextTicket) {
    queryClient.prefetchQuery(['ticket', nextTicket.id], () =>
      ticketApi.getById(nextTicket.id)
    );
  }
};
```

---

## Security Considerations

### Current Security

**API Authentication:**
- Single API key stored in `.env.local`
- API key sent in `X-API-Key` header
- No token refresh or expiration

**Issues:**
- API key committed to git (`.env.local` in repo)
- No user authentication (all agents use same key)
- No permission scoping (API key has full access)

### Proposed Security

#### 1. **User Authentication**

```typescript
// Add user login flow
POST /auth/login
  Body: { email, password }
  Response: { access_token, refresh_token, user }

// Store tokens securely
localStorage.setItem('access_token', tokens.access_token);
// OR use httpOnly cookies (preferred)

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
```

#### 2. **Token Refresh**

```typescript
// Refresh expired tokens automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      const { access_token } = await authApi.refresh(refreshToken);
      localStorage.setItem('access_token', access_token);

      // Retry original request
      error.config.headers['Authorization'] = `Bearer ${access_token}`;
      return apiClient.request(error.config);
    }
    throw error;
  }
);
```

#### 3. **Tenant Isolation**

```typescript
// Add tenant context to all requests
const TENANT_ID = import.meta.env.VITE_TENANT_ID;

apiClient.interceptors.request.use((config) => {
  config.headers['X-Tenant-ID'] = TENANT_ID;
  return config;
});
```

---

## Testing Strategy

### Current Testing (Minimal)

- No unit tests
- No integration tests
- Manual testing only
- No CI/CD pipeline

### Proposed Testing

#### 1. **Unit Tests (Vitest)**

```typescript
// src/api/tickets.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ticketApi } from './tickets';

describe('ticketApi', () => {
  it('should fetch ticket by id', async () => {
    const mockTicket = { id: '123', subject: 'Test' };
    vi.spyOn(apiClient, 'get').mockResolvedValue(mockTicket);

    const ticket = await ticketApi.getById('123');
    expect(ticket).toEqual(mockTicket);
  });
});
```

#### 2. **Component Tests (React Testing Library)**

```typescript
// src/pages/InboxPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InboxPage } from './InboxPage';

test('displays ticket list', async () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <InboxPage />
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Help choosing batting')).toBeInTheDocument();
  });
});
```

#### 3. **E2E Tests (Playwright)**

```typescript
// tests/e2e/ticket-flow.spec.ts
import { test, expect } from '@playwright/test';

test('agent can view and respond to ticket', async ({ page }) => {
  await page.goto('http://localhost:5173/inbox');
  await page.click('text=Help choosing batting');
  await expect(page).toHaveURL(/\/tickets\/[a-f0-9-]+/);

  await page.fill('[placeholder*="Type your response"]', 'Hello!');
  await page.click('button:has-text("Send")');

  await expect(page.locator('.message:has-text("Hello!")')).toBeVisible();
});
```

---

## Deployment

### Current Deployment

**Platform**: Railway
**URL**: https://front-end-alpha-ecommerce.up.railway.app (assumed)
**Build Command**: `npm run build`
**Start Command**: `npm run preview` (production build preview)

**Issues:**
- No staging environment
- No preview deployments for PRs
- Manual deployment process

### Proposed Deployment

#### 1. **Environments**

```
Development:  http://localhost:5173 (local dev server)
Staging:      https://staging-support.quimbi.com
Production:   https://support.quimbi.com
```

#### 2. **CI/CD Pipeline (GitHub Actions)**

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway (Staging)
        run: railway up --environment staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway (Production)
        run: railway up --environment production
```

#### 3. **Preview Deployments**

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Preview
        run: railway up --detach
      - name: Comment PR with preview URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed: https://pr-${{ github.event.number }}.railway.app'
            })
```

---

## Success Criteria

The frontend architecture will be successful when:

1. ✅ **Backend Independence**: Can switch backends without frontend code changes
2. ✅ **Performance**: < 1s time to interactive, < 200ms for ticket view
3. ✅ **Reliability**: 99.9% uptime, graceful degradation on backend failures
4. ✅ **Testability**: 80%+ code coverage, E2E tests for critical flows
5. ✅ **Security**: User authentication, no API keys in code, tenant isolation
6. ✅ **Maintainability**: Clear separation of concerns, typed APIs, documented
7. ✅ **Developer Experience**: Hot reload < 200ms, easy local setup

---

## Questions for Stakeholders

1. **Multi-Backend Priority**: Should we prioritize supporting microservices architecture, or is monolithic backend sufficient for now?

2. **Demo Mode**: Should demo messages be frontend-only (no backend storage), or should we have a dedicated demo environment?

3. **User Authentication**: Do we need per-agent authentication, or is shared API key acceptable?

4. **Tenant Isolation**: Will we have multiple tenants (different businesses), or single tenant per deployment?

5. **Offline Support**: Should the frontend work offline (service worker, local storage)?

6. **Real-Time Updates**: Should ticket updates appear in real-time (WebSocket, SSE), or polling is acceptable?

7. **Mobile Support**: Is mobile/tablet support required, or desktop-only?

8. **Accessibility**: What WCAG level do we need to meet (AA, AAA)?

---

**Document Owner**: Quimbi Frontend Team
**Last Updated**: December 1, 2025
**Next Review**: After Support Backend separation

---

## Appendix: API Endpoint Mapping

### Current Monolithic Backend

| Endpoint | Purpose | Should Move To |
|----------|---------|---------------|
| `GET /api/tickets` | List tickets | Support Backend |
| `GET /api/tickets/{id}` | Get ticket details | Support Backend |
| `POST /api/tickets` | Create ticket | Support Backend |
| `PATCH /api/tickets/{id}` | Update ticket | Support Backend |
| `POST /api/tickets/{id}/messages` | Send message | Support Backend |
| `POST /api/tickets/{id}/notes` | Add note | Support Backend |
| `GET /api/tickets/{id}/notes` | Get notes | Support Backend |
| `POST /api/tickets/{id}/reset-conversation` | Reset demo | Support Backend (demo mode) |
| `GET /api/ai/tickets/{id}/recommendation` | AI recommendations | Intelligence Backend |
| `GET /api/ai/tickets/{id}/draft-response` | AI draft | Intelligence Backend |
| `POST /api/ai/tickets/{id}/draft-response/regenerate` | Regenerate draft | Intelligence Backend |
| `PATCH /api/ai/tickets/{id}/recommendation/actions/{i}` | Mark action complete | Intelligence Backend |
| `GET /api/mcp/customer/random` | Random customer (demo) | Intelligence Backend |
| `GET /api/mcp/customer/{id}` | Customer profile | Intelligence Backend |
| `GET /api/mcp/customer/{id}/churn-risk` | Churn risk details | Intelligence Backend |
| `GET /api/mcp/customer/{id}/orders` | Order history | Intelligence Backend |
| `GET /health` | Health check | Both backends |
| `GET /openapi.json` | API docs | Both backends |

### Target Microservices Architecture

**Support Backend:**
- All ticket CRUD operations
- Message management
- Note management
- Assignment and routing
- Demo mode (optional)

**Intelligence Backend:**
- Customer profiles and segmentation
- AI draft generation (stateless)
- Recommendations (stateless)
- Churn predictions
- Analytics and reporting

**Frontend:**
- Calls both backends in parallel
- Merges data for display
- Handles backend failures gracefully
