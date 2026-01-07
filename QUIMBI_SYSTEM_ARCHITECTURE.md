# Quimbi Platform - Complete System Architecture

**Date**: December 1, 2025
**Purpose**: Define the complete architecture, boundaries, and responsibilities for the entire Quimbi customer support platform

---

## Executive Summary

The Quimbi Platform is being delineated into three distinct components:

1. **Quimbi Intelligence Backend (AI/ML/Brains)** - Customer intelligence, predictions, and AI content generation
2. **Support Backend (Operations)** - Ticketing, messages, agent workflows (to be created)
3. **Frontend (UI)** - React-based agent interface

This document defines the current state, target architecture, and migration path for the entire platform.

---

## System Architecture Overview

### Target Architecture (Microservices)

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React SPA)                    │
│                                                              │
│  - Ticket list and detail views                            │
│  - Customer profile display                                 │
│  - AI recommendations and drafts                            │
│  - Demo mode for testing                                    │
│                                                              │
│  Tech: React 18, TypeScript, Vite, Tailwind CSS            │
└─────────┬─────────────────────────┬─────────────────────────┘
          │                         │
          │                         │
          ▼                         ▼
┌──────────────────────┐  ┌───────────────────────────────────┐
│   Support Backend    │  │  Quimbi Intelligence Backend      │
│   (To Be Created)    │  │  (AI/ML/Brains)                   │
│                      │  │                                    │
│  - Tickets CRUD      │  │  - Customer segmentation          │
│  - Messages          │  │  - Archetype classification       │
│  - Agent routing     │  │  - Churn prediction               │
│  - SLA tracking      │  │  - LTV forecasting                │
│  - Queues            │  │  - AI draft generation            │
│                      │  │  - Recommendation engine          │
│  Calls Intelligence →│  │  - Analytics aggregation          │
│  for enrichment      │  │                                    │
└──────────────────────┘  └───────────────────────────────────┘
          │                         │
          │                         │
          ▼                         ▼
┌──────────────────────┐  ┌───────────────────────────────────┐
│  Support Database    │  │  Intelligence Database            │
│  (PostgreSQL)        │  │  (PostgreSQL)                     │
│                      │  │                                    │
│  - tickets           │  │  Schema: platform                 │
│  - ticket_messages   │  │  - customer_profiles              │
│  - ticket_notes      │  │  - archetype_definitions          │
│  - agent_assignments │  │  - segment_definitions            │
│  - queues            │  │                                    │
│                      │  │  Schema: shared                   │
│                      │  │  - mcp_queries (cache)            │
│                      │  │  - analytics_cache                │
└──────────────────────┘  └───────────────────────────────────┘
```

### Current Architecture (Monolithic - To Be Refactored)

```
┌─────────────────────────────────────┐
│      Frontend (React SPA)           │
│                                      │
│  Calls single backend for all data  │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Monolithic Backend (unified-segmentation)   │
│                                               │
│  ⚠️ MIXED CONCERNS:                          │
│  - Ticketing (should move to Support)        │
│  - Customer intelligence (stays)             │
│  - AI generation (stays)                     │
│  - Analytics (stays)                         │
│                                               │
│  All endpoints served from single API        │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Single Database (PostgreSQL)                │
│                                               │
│  Schemas: platform, support_app, shared      │
└──────────────────────────────────────────────┘
```

---

# Part 1: Quimbi Intelligence Backend (AI/ML/Brains)

## What This Backend IS

- **Customer Intelligence Engine**: Analyzes customer behavior and provides insights
- **ML/AI Service**: Runs segmentation, churn prediction, LTV forecasting
- **Recommendation Engine**: Suggests actions, content, and strategies
- **Analytics Platform**: Aggregates and analyzes behavioral data

## What This Backend IS NOT

- ❌ CRM System (customer records, contact management)
- ❌ Ticketing System (support tickets, queues, assignments)
- ❌ Customer Support Tool (workflows, SLAs, agent assignments)
- ❌ Transactional Database (orders, payments, shipments)

## Core Responsibilities

### 1. Customer Behavioral Intelligence

**What it owns:**
- Customer segmentation across 8 behavioral axes
- Archetype classification (strength, tendency, emerging)
- Segment membership scores and confidence levels
- Behavioral pattern recognition

**Input Data Sources:**
- E-commerce platform data (Shopify, BigCommerce, etc.)
- Purchase history and transaction data
- Product interaction data
- Customer lifecycle events

**Output:**
- Customer segment memberships
- Dominant segment per axis
- Archetype assignments
- Segment definitions and characteristics

### 2. Predictive Analytics

**What it owns:**
- Churn risk scoring and prediction
- Lifetime value (LTV) forecasting
- Next purchase prediction
- Customer trajectory modeling

**ML Models:**
- Churn prediction model (probability of leaving)
- LTV prediction model (expected future value)
- Engagement scoring model
- Repurchase timing model

**Output:**
- Churn risk scores (0-1)
- Predicted LTV (dollar amount)
- Risk factors and drivers
- Confidence intervals

### 3. Recommendation Engine

**What it owns:**
- Action recommendations based on customer intelligence
- Communication strategy suggestions
- Intervention timing recommendations
- Personalization guidance

**Recommendation Types:**
- **Customer Actions**: What to do for specific customers
- **Communication Tone**: How to speak to different archetypes
- **Timing**: When to reach out or offer promotions
- **Content**: What products/messages to show

**Output:**
- Prioritized action recommendations
- Reasoning and confidence scores
- Expected impact estimates
- Success probability

### 4. Natural Language Intelligence

**What it owns:**
- AI-powered query understanding
- Customer profile summarization
- Draft content generation (not final delivery)
- Insight explanation and reasoning

**Capabilities:**
- Parse natural language queries about customers
- Generate draft responses (templates, not final tickets)
- Explain archetypes and segments in plain language
- Summarize customer behavior narratives

**Output:**
- Structured query results
- Draft content and templates
- Explanations and reasoning
- Insight narratives

## Intelligence Backend API Structure

### Proposed Clean API (Target State)

```
/api/intelligence/*     - Customer intelligence and predictions
  POST /analyze         - Full customer intelligence profile
  GET /churn-risk/{customer_id}
  GET /lifetime-value/{customer_id}
  POST /batch-analyze   - Bulk customer analysis

/api/segments/*         - Segmentation queries and definitions
  GET /definitions      - All segment definitions
  GET /customer/{customer_id}
  POST /query           - Query customers by segment criteria

/api/archetypes/*       - Archetype definitions and analysis
  GET /definitions      - All archetype definitions
  GET /{archetype_id}   - Specific archetype details
  GET /top              - Top archetypes by population

/api/generation/*       - AI content generation (stateless)
  POST /draft-response  - Generate draft message
  POST /recommendations - Generate action recommendations
  POST /summary         - Summarize customer behavior
  POST /campaign-content - Generate campaign copy

/api/query/*            - Natural language and structured queries
  POST /natural-language
  POST /customers       - Structured customer queries

/api/analytics/*        - Aggregated analytics and trends
  GET /cohorts
  GET /segments/distribution
  GET /churn/trends

/health                 - System health check
```

## Intelligence Backend Data Architecture

### What It Stores (Schema: `platform`)

```sql
-- Customer intelligence profiles (calculated)
platform.customer_profiles
- customer_id (references external customer)
- archetype_id
- archetype_level
- segment_memberships (JSONB)
- dominant_segments (JSONB)
- churn_risk_score
- predicted_ltv
- current_ltv
- last_calculated_at

-- Archetype definitions (ML-generated)
platform.archetype_definitions
- archetype_id (e.g., arch_334610)
- archetype_level (strength, tendency, emerging)
- dominant_segments (JSONB)
- member_count
- behavioral_traits
- recommended_actions

-- Segment definitions (business rules + ML)
platform.segment_definitions
- segment_id
- axis (purchase_value, return_behavior, etc.)
- segment_name (whale, deal_hunter, etc.)
- description
- scoring_criteria
```

### What It Does NOT Store

❌ **Support/Ticketing Data** (should be in Support Backend):
- Tickets, messages, assignments
- Support queues, SLAs
- Agent performance data
- Ticket history and resolutions

❌ **CRM Operational Data** (should be in CRM Backend):
- Customer contact information
- Contact history and notes
- Lead tracking, opportunity management
- Sales pipeline data

❌ **Transactional Data** (stays in e-commerce platform):
- Orders, payments, shipments
- Product catalog
- Inventory

---

# Part 2: Support Backend (To Be Created)

## What This Backend IS

- **Ticketing System**: CRUD operations for support tickets
- **Message Management**: Customer and agent messages
- **Workflow Engine**: Ticket routing, assignments, SLAs
- **Queue Management**: Support queues and prioritization
- **Operational Database**: Stores all support-related data

## What This Backend IS NOT

- ❌ Customer Intelligence (calls Intelligence Backend for that)
- ❌ AI/ML Service (calls Intelligence Backend for recommendations)
- ❌ Analytics Platform (calls Intelligence Backend for insights)
- ❌ CRM System (focused on support, not sales/marketing)

## Support Backend Responsibilities

### 1. Ticket Lifecycle Management

**Operations:**
- Create new tickets from various channels (email, chat, phone)
- Update ticket status (open → pending → closed)
- Assign tickets to agents or queues
- Transfer tickets between queues
- Bulk ticket operations

### 2. Message Management

**Operations:**
- Store customer messages
- Store agent replies
- Track message history and timestamps
- Support attachments and rich content
- Message threading and conversation view

### 3. Internal Notes

**Operations:**
- Add agent-only notes to tickets
- Track note authors and timestamps
- Notes not visible to customers
- Support @mentions and collaboration

### 4. Agent Workflow

**Operations:**
- Agent assignment and routing rules
- SLA tracking and alerts
- Ticket queues (urgent, high, normal, low)
- Agent performance tracking
- Workload balancing

### 5. Demo Mode

**Operations:**
- Temporary demo tickets (optional)
- Reset conversation state
- Clear demo data without affecting production

## Support Backend API Structure (Proposed)

```
/api/tickets/*          - Ticket CRUD operations
  GET /                 - List tickets (with filtering)
  GET /{id}             - Get ticket details
  POST /                - Create new ticket
  PATCH /{id}           - Update ticket metadata
  DELETE /{id}          - Delete ticket (admin only)

/api/tickets/{id}/messages/* - Message operations
  GET /                 - Get all messages for ticket
  POST /                - Send message (customer or agent)
  PATCH /{message_id}   - Edit message
  DELETE /{message_id}  - Delete message

/api/tickets/{id}/notes/* - Internal notes
  GET /                 - Get all notes
  POST /                - Add note

/api/tickets/{id}/workflow/* - Workflow operations
  PATCH /assign         - Assign to agent
  POST /transfer        - Transfer to queue
  PATCH /status         - Update status
  POST /tag             - Add/remove tags

/api/tickets/{id}/demo/* - Demo mode operations
  POST /messages        - Add temporary demo message
  POST /reset           - Reset conversation to initial state

/api/queues/*           - Queue management
  GET /                 - List all queues
  GET /{id}/tickets     - Get tickets in queue

/api/assignments/*      - Agent assignments
  GET /agent/{agent_id} - Get tickets for agent
  POST /bulk-assign     - Bulk assign tickets

/health                 - Health check
```

## Support Backend Data Architecture (Proposed)

### Schema: `support`

```sql
-- Tickets table
support.tickets
- id (UUID, primary key)
- customer_id (references external customer)
- subject
- status (open, pending, closed)
- priority (urgent, high, normal, low)
- channel (email, sms, phone, chat, form)
- assigned_to (agent_id, nullable)
- queue_id (nullable)
- tags (array)
- created_at
- updated_at
- closed_at

-- Messages table
support.ticket_messages
- id (UUID, primary key)
- ticket_id (foreign key)
- from_agent (boolean)
- content (text)
- author_name
- author_email
- author_id (agent_id or customer_id)
- created_at
- edited_at (nullable)

-- Notes table (internal only)
support.ticket_notes
- id (UUID, primary key)
- ticket_id (foreign key)
- content (text)
- author_name
- author_id (agent_id)
- created_at

-- Queues table
support.queues
- id (UUID, primary key)
- name
- description
- priority_order

-- Agent assignments
support.agent_assignments
- id (UUID, primary key)
- agent_id
- ticket_id
- assigned_at
- status (active, completed)
```

---

# Part 3: Frontend (React SPA)

## What The Frontend IS

- **Customer Support Interface**: Primary UI for support agents
- **Intelligence Dashboard**: Displays customer behavioral insights
- **Ticket Management UI**: View, respond to, and manage support tickets
- **AI Recommendation Display**: Shows AI-generated suggestions and drafts
- **Demo Environment**: Includes demo mode for testing AI responses

## What The Frontend IS NOT

- ❌ Backend service (no business logic or data storage)
- ❌ Independent application (requires backend APIs)
- ❌ Multi-tenant admin portal (single tenant per deployment)
- ❌ Public-facing customer portal (agent-only interface)

## Frontend Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Deployment**: Railway (production)

## Frontend Pages & Components

### Pages

1. **InboxPage** - Ticket list with filtering and smart ordering
2. **TicketDetailPage** - Full ticket view with customer profile and AI tools
3. **CustomerPage** - Standalone customer profile view
4. **AnalyticsPage** - Dashboard with metrics
5. **DemoPage** - Testing/demo interface

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

## Frontend API Dependencies

### Current State (Monolithic Backend)

```typescript
// All API calls go to single backend
const API_BASE_URL = 'https://ecommerce-backend-staging-a14c.up.railway.app'

// src/api/tickets.ts
GET    /api/tickets                        // Support Backend concern
GET    /api/tickets/{id}                   // Support Backend concern
POST   /api/tickets                        // Support Backend concern
POST   /api/tickets/{id}/messages          // Support Backend concern
POST   /api/tickets/{id}/reset-conversation // Support Backend concern

// src/api/ai.ts
GET    /api/ai/tickets/{id}/recommendation  // Intelligence Backend
GET    /api/ai/tickets/{id}/draft-response  // Intelligence Backend
POST   /api/ai/tickets/{id}/draft-response/regenerate // Intelligence Backend

// src/api/customers.ts
GET    /api/mcp/customer/{id}              // Intelligence Backend
GET    /api/mcp/customer/{id}/churn-risk   // Intelligence Backend
GET    /api/mcp/customer/{id}/orders       // Intelligence Backend
```

### Target State (Microservices)

```typescript
// Separate API clients for each backend
const SUPPORT_API_URL = import.meta.env.VITE_SUPPORT_API_URL
const INTELLIGENCE_API_URL = import.meta.env.VITE_INTELLIGENCE_API_URL

// Support Backend API
supportApi.get('/api/tickets')
supportApi.get('/api/tickets/{id}')
supportApi.post('/api/tickets/{id}/messages')

// Intelligence Backend API
intelligenceApi.get('/api/intelligence/customer/{id}')
intelligenceApi.post('/api/generation/draft-response', {...})
intelligenceApi.post('/api/generation/recommendations', {...})
```

## Frontend Data Flow

### Current Flow (Monolithic)

```
User opens ticket detail page
    ↓
Frontend makes parallel requests:
  ├─ GET /api/tickets/{id}              → Returns ticket + messages + customer_profile
  └─ GET /api/ai/tickets/{id}/draft     → Returns AI draft
    ↓
Frontend displays everything together
```

**Problem**: Customer profile is embedded in ticket response (inefficient, not reusable)

### Target Flow (Microservices)

```
User opens ticket detail page
    ↓
Frontend makes parallel requests to different backends:
  ├─ Support Backend:
  │   GET /api/tickets/{id}             → Returns ticket + messages
  │
  └─ Intelligence Backend:
      ├─ GET /api/intelligence/customer/{customer_id} → Customer profile
      └─ POST /api/generation/draft-response → AI draft
    ↓
Frontend merges data and displays
```

**Benefit**: Separate concerns, independent caching, reusable customer profiles

---

# Integration Patterns

## Pattern 1: Intelligence Enrichment (Support → Intelligence)

```
┌──────────────┐         ┌─────────────────────┐
│   Frontend   │         │  Support Backend    │
│              │────────→│                     │
│  Loads       │  1. Get │  Returns ticket     │
│  ticket      │  ticket │  (no profile)       │
│              │←────────│                     │
└──────┬───────┘         └─────────────────────┘
       │
       │ 2. Get customer intelligence
       ↓
┌─────────────────────────────────────┐
│  Intelligence Backend               │
│                                     │
│  Returns:                           │
│  - Archetype                        │
│  - Segments                         │
│  - Churn risk                       │
│  - Business metrics                 │
└─────────────────────────────────────┘
       ↓
┌──────────────┐
│   Frontend   │
│              │
│  Displays    │
│  merged data │
└──────────────┘
```

## Pattern 2: AI Draft Generation (Support → Intelligence)

```
Agent opens ticket
    ↓
Frontend requests draft from Intelligence Backend
    POST /api/generation/draft-response
    Body: {
      ticket_id: "...",
      customer_id: "...",
      context: {
        messages: [...],
        ticket_priority: "high"
      },
      tone: "friendly"
    }
    ↓
Intelligence Backend:
  1. Loads customer intelligence
  2. Analyzes ticket sentiment
  3. Generates personalized draft
    ↓
Returns draft to Frontend
    ↓
Agent reviews and sends via Support Backend
```

## Pattern 3: Real-Time Recommendations

```
Agent views ticket
    ↓
Frontend requests recommendations
    POST /api/generation/recommendations
    Body: {
      customer_id: "...",
      context: {
        churn_risk: 0.8,
        ltv: 1250,
        archetype: "whale",
        ticket_sentiment: -0.5
      }
    }
    ↓
Intelligence Backend returns:
  - Prioritized actions
  - Reasoning
  - Expected impact
    ↓
Frontend displays as checklist
    ↓
Agent completes actions tracked in Support Backend
```

## Pattern 4: Demo Mode (Frontend-Only)

```
┌──────────────────────────────┐
│  Demo Mode Toggle ON         │
│                              │
│  Messages stored in:         │
│  - React state (local)       │
│  - NOT sent to backend       │
│                              │
│  Reset button:               │
│  - Clears React state        │
│  - Does NOT call backend     │
└──────────────────────────────┘

┌──────────────────────────────┐
│  Demo Mode Toggle OFF        │
│                              │
│  Messages stored in:         │
│  - Support Backend database  │
│  - Persisted permanently     │
│                              │
│  Reset button:               │
│  - Calls DELETE endpoint     │
│  - Removes from database     │
└──────────────────────────────┘
```

---

# Migration Roadmap

## Phase 1: Document & Freeze (✅ Current)

- ✅ Define Quimbi Intelligence Backend boundaries
- ✅ Define Support Backend requirements
- ✅ Document Frontend responsibilities
- ✅ Map current API dependencies
- ✅ Identify components to extract

## Phase 2: API Stabilization (Intelligence Backend)

**Timeline**: 2-3 weeks

**Goals:**
- Create versioned Intelligence API endpoints (`/v1/intelligence/*`)
- Document all request/response schemas (OpenAPI)
- Implement rate limiting and quotas
- Add comprehensive monitoring

**Tasks:**
1. Add API versioning to Intelligence Backend
2. Generate OpenAPI specification
3. Implement rate limiting middleware
4. Add request/response validation
5. Set up API metrics dashboard

**Success Criteria:**
- All Intelligence APIs documented in OpenAPI
- Rate limiting active (1000 req/min per API key)
- 95th percentile latency < 200ms
- API documentation published

## Phase 3: Create Support Backend (New Service)

**Timeline**: 4-6 weeks

**Goals:**
- Build new Support Backend service
- Migrate ticket schema and logic
- Support Backend calls Intelligence Backend for enrichment
- Frontend supports both monolithic and microservices modes

**Tasks:**

### 3.1: Support Backend Foundation
1. Set up new FastAPI/Python service
2. Create database schema (`support` schema)
3. Implement basic ticket CRUD endpoints
4. Add authentication and API key management

### 3.2: Migrate Ticket Data
1. Export ticket data from monolithic backend
2. Import into Support Backend database
3. Verify data integrity
4. Test ticket operations

### 3.3: Intelligence Integration
1. Support Backend calls Intelligence Backend for customer profiles
2. Implement caching for customer intelligence
3. Handle Intelligence Backend failures gracefully

### 3.4: Frontend Adaptation Layer
1. Create API factory pattern in frontend
2. Support both monolithic and microservices modes via env var
3. Frontend can toggle between backends without code changes

**Success Criteria:**
- Support Backend passes all ticket operation tests
- Data migration 100% successful
- Frontend works with both backends
- No data loss or corruption

## Phase 4: Migrate Frontend to Microservices

**Timeline**: 2-3 weeks

**Goals:**
- Frontend calls Support Backend for tickets
- Frontend calls Intelligence Backend for customer intelligence
- Parallel data fetching optimized
- Demo mode implemented

**Tasks:**

### 4.1: Separate API Clients
```typescript
// src/lib/support-api-client.ts
export const supportApi = new ApiClient(SUPPORT_API_URL);

// src/lib/intelligence-api-client.ts
export const intelligenceApi = new ApiClient(INTELLIGENCE_API_URL);
```

### 4.2: Update API Modules
```typescript
// src/api/tickets.ts - now calls Support Backend
export const ticketApi = {
  list: () => supportApi.get('/api/tickets'),
  getById: (id) => supportApi.get(`/api/tickets/${id}`),
};

// src/api/customers.ts - now calls Intelligence Backend
export const customerApi = {
  getProfile: (id) => intelligenceApi.get(`/api/intelligence/customer/${id}`),
};
```

### 4.3: Optimize Data Fetching
```typescript
// Parallel fetch ticket and customer
const { data: ticket } = useQuery(['ticket', id], () => ticketApi.getById(id));
const { data: customer } = useQuery(['customer', ticket?.customer_id], () =>
  customerApi.getProfile(ticket.customer_id),
  { enabled: !!ticket }
);
```

### 4.4: Implement Demo Mode
```typescript
const [demoMode, setDemoMode] = useState(false);
const [demoMessages, setDemoMessages] = useState([]);

if (demoMode) {
  // Frontend-only storage
  setDemoMessages([...demoMessages, newMessage]);
} else {
  // Backend persistence
  await ticketApi.sendMessage(ticketId, newMessage);
}
```

**Success Criteria:**
- Frontend loads < 1s time to interactive
- Ticket view < 200ms render time
- Demo mode works without backend calls
- No regressions in functionality

## Phase 5: Deprecate Monolithic Ticket Endpoints

**Timeline**: 1-2 weeks

**Goals:**
- Remove ticket endpoints from Intelligence Backend
- All production traffic on microservices
- Monitor and optimize

**Tasks:**
1. Add deprecation warnings to monolithic ticket endpoints
2. Monitor usage to ensure all clients migrated
3. Remove ticket tables from Intelligence Backend
4. Drop monolithic API mode from frontend
5. Update all documentation

**Success Criteria:**
- Zero traffic to deprecated endpoints for 1 week
- All ticket data in Support Backend
- Frontend only uses microservices mode
- Intelligence Backend has no ticket tables

## Phase 6: Optimize & Polish

**Timeline**: Ongoing

**Goals:**
- Optimize performance across all services
- Implement advanced caching strategies
- Add comprehensive monitoring
- Improve developer experience

**Tasks:**
1. Implement Redis caching for customer profiles
2. Add CDN for frontend assets
3. Optimize database queries and indexes
4. Set up distributed tracing (OpenTelemetry)
5. Add load testing and capacity planning
6. Implement auto-scaling policies

**Success Criteria:**
- 99.9% uptime for all services
- 95th percentile latency < 200ms end-to-end
- Can handle 10,000+ requests/minute
- Comprehensive metrics and alerting

---

# Environment Configuration

## Current (Monolithic)

```bash
# Frontend .env.local
VITE_API_BASE_URL=https://ecommerce-backend-staging-a14c.up.railway.app
VITE_API_KEY=e340256ddd65ab5d9643762f62eea44d7dfb95df32685e31
```

## Target (Microservices)

### Frontend Environment

```bash
# Support Backend
VITE_SUPPORT_API_URL=https://support-backend.quimbi.com
VITE_SUPPORT_API_KEY=sk_support_abc123...

# Intelligence Backend
VITE_INTELLIGENCE_API_URL=https://intelligence-backend.quimbi.com
VITE_INTELLIGENCE_API_KEY=sk_intelligence_xyz789...

# Feature Flags
VITE_DEMO_MODE_ENABLED=true
VITE_AI_RECOMMENDATIONS_ENABLED=true
```

### Support Backend Environment

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/support_db

# Intelligence Backend
INTELLIGENCE_API_URL=https://intelligence-backend.quimbi.com
INTELLIGENCE_API_KEY=sk_internal_backend123...

# API Configuration
API_KEY=sk_support_abc123...
RATE_LIMIT=1000  # requests per minute
```

### Intelligence Backend Environment

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/intelligence_db

# E-commerce Platform
SHOPIFY_API_URL=https://shop.myshopify.com
SHOPIFY_API_KEY=...

# ML Model Configuration
MODEL_VERSION=v1.2.3
MODEL_UPDATE_SCHEDULE=0 2 * * *  # Daily at 2 AM

# API Configuration
API_KEY=sk_intelligence_xyz789...
RATE_LIMIT=500  # requests per minute
```

---

# API Endpoint Mapping (Migration Reference)

| Current Endpoint (Monolithic) | Target Backend | New Endpoint |
|-------------------------------|----------------|--------------|
| `GET /api/tickets` | Support | `GET /api/tickets` |
| `GET /api/tickets/{id}` | Support | `GET /api/tickets/{id}` |
| `POST /api/tickets` | Support | `POST /api/tickets` |
| `PATCH /api/tickets/{id}` | Support | `PATCH /api/tickets/{id}` |
| `POST /api/tickets/{id}/messages` | Support | `POST /api/tickets/{id}/messages` |
| `POST /api/tickets/{id}/notes` | Support | `POST /api/tickets/{id}/notes` |
| `GET /api/tickets/{id}/notes` | Support | `GET /api/tickets/{id}/notes` |
| `POST /api/tickets/{id}/reset-conversation` | Support | `POST /api/tickets/{id}/demo/reset` |
| `GET /api/ai/tickets/{id}/recommendation` | Intelligence | `POST /api/generation/recommendations` |
| `GET /api/ai/tickets/{id}/draft-response` | Intelligence | `POST /api/generation/draft-response` |
| `POST /api/ai/tickets/{id}/draft-response/regenerate` | Intelligence | `POST /api/generation/draft-response` |
| `GET /api/mcp/customer/{id}` | Intelligence | `GET /api/intelligence/customer/{id}` |
| `GET /api/mcp/customer/{id}/churn-risk` | Intelligence | `GET /api/intelligence/churn-risk/{id}` |
| `GET /api/mcp/customer/{id}/orders` | Intelligence | `GET /api/intelligence/customer/{id}` (embedded) |

---

# Success Criteria

The Quimbi Platform architecture will be successful when:

## Intelligence Backend
1. ✅ **Clear boundaries**: Everyone knows what belongs in Intelligence Backend
2. ✅ **Stateless intelligence**: No operational state, only calculated insights
3. ✅ **API-first**: All intelligence consumed via well-documented APIs
4. ✅ **Scalable**: Can handle 10,000+ intelligence requests/minute
5. ✅ **Fast**: 95th percentile response time < 200ms for cached queries
6. ✅ **Accurate**: ML models retrained weekly with latest behavioral data

## Support Backend
1. ✅ **Reliable**: 99.9% uptime for ticket operations
2. ✅ **Fast**: Ticket CRUD operations < 100ms
3. ✅ **Scalable**: Can handle 1,000+ concurrent agents
4. ✅ **Data integrity**: Zero data loss, full audit trail
5. ✅ **Workflow automation**: SLA tracking, auto-routing working

## Frontend
1. ✅ **Performance**: < 1s time to interactive, < 200ms for ticket view
2. ✅ **Reliability**: Graceful degradation on backend failures
3. ✅ **Testability**: 80%+ code coverage, E2E tests for critical flows
4. ✅ **Security**: User authentication, no API keys in code, tenant isolation
5. ✅ **Maintainability**: Clear separation of concerns, typed APIs

## Platform-Wide
1. ✅ **Observability**: Comprehensive metrics and distributed tracing
2. ✅ **Documentation**: All APIs documented with OpenAPI specs
3. ✅ **Developer Experience**: Easy local setup, fast development cycle
4. ✅ **Production Ready**: CI/CD pipelines, automated testing, rollback capability

---

# Questions for Stakeholders

## Architecture & Scale
1. **Multi-tenancy**: Should each tenant (business) get a separate database instance, or is schema-level isolation sufficient?
2. **Real-time updates**: Should ticket updates appear in real-time (WebSocket), or is polling acceptable?
3. **Intelligence refresh**: Should customer intelligence be real-time (on every order) or batch (hourly/daily)?
4. **Historical data**: How long should we retain ticket history? Customer intelligence snapshots?

## Features & Functionality
5. **Demo mode**: Should demo messages be frontend-only (no backend storage), or dedicated demo environment?
6. **User authentication**: Per-agent authentication required, or shared API key acceptable for MVP?
7. **Offline support**: Should frontend work offline (service worker, local storage)?
8. **Mobile support**: Is mobile/tablet support required, or desktop-only?

## Business & Operations
9. **Webhook strategy**: Should Intelligence Backend publish events (e.g., "customer became high churn risk")?
10. **ML model deployment**: Should models be versioned and A/B tested, or single production model?
11. **SLA requirements**: What are the uptime and latency SLAs for each component?
12. **Compliance**: Any specific data retention, GDPR, or security compliance requirements?

---

# Appendix A: Technology Choices Rationale

## Intelligence Backend: Python + FastAPI
**Chosen**: Python with FastAPI
**Reasons**:
- ML/AI ecosystem (scikit-learn, PyTorch, TensorFlow)
- FastAPI for async, high-performance APIs
- Type hints for API contracts (Pydantic)
- Easy integration with data science tools

**Alternatives Considered**:
- Node.js + Express (rejected: weaker ML ecosystem)
- Go (rejected: harder to integrate with ML libraries)

## Support Backend: Python + FastAPI
**Chosen**: Python with FastAPI (matching Intelligence Backend)
**Reasons**:
- Consistency with Intelligence Backend
- Fast development velocity
- Easy to share models/libraries between backends
- Strong async support for high concurrency

**Alternatives Considered**:
- Node.js + Express (rejected: prefer consistency)
- Ruby on Rails (rejected: slower for high-concurrency)

## Frontend: React + TypeScript + Vite
**Chosen**: React 18 with TypeScript, Vite build tool
**Reasons**:
- React: Industry standard, large ecosystem, great developer experience
- TypeScript: Type safety, better refactoring, fewer bugs
- Vite: Fast hot reload (<200ms), modern build tool
- Tailwind CSS: Rapid UI development, consistent styling

**Alternatives Considered**:
- Vue.js (rejected: team more familiar with React)
- Next.js (rejected: don't need SSR for agent tool)
- Webpack (rejected: Vite much faster for development)

## Database: PostgreSQL
**Chosen**: PostgreSQL for all backends
**Reasons**:
- JSONB support for flexible schemas (segments, archetypes)
- Strong ACID guarantees for ticket data
- Excellent full-text search
- Battle-tested, reliable
- Good performance for both OLTP and analytics

**Alternatives Considered**:
- MongoDB (rejected: ACID guarantees weaker)
- MySQL (rejected: weaker JSON support)
- Separate OLTP/OLAP databases (deferred: premature optimization)

## Deployment: Railway
**Chosen**: Railway for all services
**Reasons**:
- Simple deployment (git push)
- Built-in database provisioning
- Environment management
- Preview deployments for PRs
- Cost-effective for MVP

**Alternatives Considered**:
- AWS ECS/Fargate (rejected: too complex for MVP)
- Heroku (rejected: more expensive than Railway)
- Kubernetes (rejected: overkill for MVP, too much ops overhead)

---

# Appendix B: Glossary

**Archetype**: A cluster of customers with similar behavioral patterns across multiple dimensions (e.g., "high-value deal hunter").

**Behavioral Axis**: A dimension of customer behavior (e.g., purchase frequency, price sensitivity).

**Churn Risk**: The probability (0-1) that a customer will stop purchasing within a given timeframe.

**Dominant Segment**: The strongest segment membership for a customer on a given behavioral axis.

**Draft Response**: AI-generated template message, not yet sent to customer.

**Fuzzy Membership**: A customer's degree of belonging to a segment (0-1 score), allowing multiple segment memberships.

**Intelligence Backend**: The ML/AI service that provides customer insights and predictions.

**LTV (Lifetime Value)**: The predicted total revenue a customer will generate over their entire relationship.

**MCP (Model Context Protocol)**: (Legacy naming) Former name for intelligence APIs.

**Next Best Action**: AI-recommended prioritized actions for an agent to take on a ticket.

**Segment**: A group of customers sharing a common behavioral trait (e.g., "deal hunter", "whale").

**Smart Score**: AI-calculated priority score for tickets, combining multiple factors.

**Support Backend**: The operational backend handling tickets, messages, and workflows.

**Tenant**: A business/organization using the Quimbi platform (e.g., "Linda's Quilting Supply").

**Topic Alert**: A keyword-based filter to surface urgent tickets (e.g., "damaged shipment").

---

**Document Owner**: Quimbi Engineering Team
**Last Updated**: December 1, 2025
**Next Review**: After Phase 3 completion (Support Backend creation)
