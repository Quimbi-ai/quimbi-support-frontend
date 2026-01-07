# Quimbi Backend API Analysis

**Date**: 2025-11-25
**Backend URL**: http://localhost:8000
**API Documentation**: http://localhost:8000/docs

## Executive Summary

The Quimbi Backend is an **AI-First CRM** built with FastAPI and PostgreSQL. It provides customer support capabilities with intelligent ticket prioritization, AI-powered draft generation, and customer intelligence integration. The architecture philosophy is **"Intelligence Replaces Interface"** - using AI to eliminate manual UI choices and research.

---

## Architecture Overview

### Core Philosophy
**Intelligence Replaces Interface**
- Smart inbox ordering (no sort UI needed)
- AI-generated response drafts (no template selection)
- Proactive context gathering (no manual lookup)
- Auto-categorization (no manual tagging)

### Technology Stack
- **Framework**: FastAPI (async Python)
- **Database**: PostgreSQL with async SQLAlchemy
- **AI Integration**: Calls separate Quimbi AI service for intelligence
- **Authentication**: JWT Bearer tokens
- **API Style**: RESTful with OpenAPI 3.1.0 specification

### Directory Structure
```
quimbi-backend/
├── app/
│   ├── api/
│   │   ├── tickets.py       # Ticket CRUD + Smart Ordering
│   │   ├── ai.py            # AI draft generation & recommendations
│   │   └── agents.py        # Agent management (auth, permissions)
│   ├── models/
│   │   ├── database.py      # SQLAlchemy models
│   │   └── schemas.py       # Pydantic schemas
│   ├── services/
│   │   ├── ai_service.py    # AI service client
│   │   └── scoring_service.py  # Ticket prioritization logic
│   ├── core/
│   │   └── config.py        # Settings & environment
│   └── main.py              # FastAPI app initialization
├── requirements.txt
└── README.md
```

---

## API Endpoints

### 1. Tickets API (`/api/tickets`)

#### `GET /api/tickets` - List Tickets (Smart Ordered)
**Purpose**: Get prioritized ticket list with intelligent scoring

**Query Parameters**:
- `status` (default: "open") - Filter by ticket status
- `channel` (optional) - Filter by channel (email, sms, chat, phone, form)
- `limit` (default: 50, max: 100) - Tickets per page
- `page` (default: 1) - Page number
- `topic_alerts` (optional) - **Comma-separated keywords to boost** (e.g., "chargeback,fraud,wrong address")
  - Matching tickets get +5.0 score boost
  - Case-insensitive substring matching

**Smart Scoring Components**:
1. **Time Decay** - Older tickets scored higher
2. **Priority Weight** - urgent > high > normal > low
3. **Customer Value** - LTV influences priority
4. **Churn Risk** - High-risk customers prioritized
5. **Sentiment** - Negative sentiment = higher score
6. **Difficulty** - Complex issues flagged
7. **Topic Alerts** - Agent-defined keyword boost

**Response Schema**:
```json
{
  "tickets": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "subject": "Order not received",
      "status": "open",
      "priority": "high",
      "channel": "email",
      "created_at": "2025-11-25T...",
      "updated_at": "2025-11-25T...",
      "customer_sentiment": 0.3,
      "estimated_difficulty": 0.7,
      "smart_score": 8.5,
      "matches_topic_alert": true,
      "customer": {
        "name": "John Doe",
        "email": "john@example.com",
        "lifetime_value": 1250.00,
        "total_orders": 8,
        "churn_risk_score": 0.65
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50
}
```

#### `GET /api/tickets/{ticket_id}` - Get Single Ticket
**Purpose**: Fetch full ticket details with messages and customer profile

**Response Includes**:
- Complete ticket data
- All messages (chronological)
- Customer profile with:
  - Archetype & behavioral segments
  - Business metrics (LTV, orders, recency, tenure)
  - Churn risk assessment
- AI draft response (if available)
- AI recommended actions (if available)

#### `POST /api/tickets` - Create Ticket
**Purpose**: Create new support ticket

**Request Body**:
```json
{
  "customer_id": "uuid",
  "subject": "Order issue",
  "channel": "email",
  "priority": "normal",
  "initial_message": "I haven't received my order..."
}
```

#### `POST /api/tickets/{ticket_id}/messages` - Send Message
**Purpose**: Add message to ticket (from agent or customer)

**Request Body**:
```json
{
  "content": "Message text",
  "from_agent": true,
  "author_name": "Agent Name"
}
```

#### `GET /api/tickets/{ticket_id}/score-breakdown` - Debug Scoring
**Purpose**: See detailed breakdown of why ticket has its smart score

**Response**:
```json
{
  "ticket_id": "uuid",
  "total_score": 8.5,
  "components": {
    "time_decay": 2.3,
    "priority_weight": 1.5,
    "customer_value": 1.8,
    "churn_risk": 2.1,
    "sentiment": 0.3,
    "difficulty": 0.5,
    "topic_alert": 5.0
  },
  "explanation": "High priority due to: customer churn risk (0.65), topic alert match (chargeback), 2.3 days old"
}
```

---

### 2. AI API (`/api/ai`)

#### `GET /api/ai/tickets/{ticket_id}/draft-response` - Get AI Draft
**Purpose**: Generate AI-powered response draft for ticket

**Flow**:
1. Fetch ticket + messages from PostgreSQL
2. Fetch customer profile from PostgreSQL
3. Call Quimbi AI: `POST /api/intelligence/analyze` (get customer DNA)
4. Call Quimbi AI: `POST /api/generation/message` (generate draft)
5. Return enriched draft to frontend

**Response**:
```json
{
  "ticket_id": "uuid",
  "draft_content": "Hi John,\n\nI'm so sorry to hear about the delay with your order...",
  "tone": "empathetic",
  "channel": "email",
  "max_length": null,
  "personalization_applied": [
    "High-value customer acknowledgment",
    "Referenced order #12345",
    "Offered expedited replacement"
  ],
  "customer_dna": {
    "archetype_id": "premium_loyalist",
    "communication_preferences": ["detailed", "professional"],
    "value_tier": "premium"
  },
  "churn_risk": 0.18,
  "metadata": {
    "generated_at": "2025-11-25T...",
    "model_version": "gpt-4"
  }
}
```

**Automatic Context Inclusion**:
- Channel-appropriate tone and length
- Customer behavioral profile
- Recent order/tracking info
- Past ticket resolution patterns
- VIP treatment if high-value
- Extra care if high churn risk

#### `POST /api/ai/tickets/{ticket_id}/regenerate-draft` - Regenerate Draft
**Purpose**: Force regenerate draft (bypasses cache)

**Use Cases**:
- Agent doesn't like first draft
- Context has changed (order shipped, customer updated)
- Want different tone/approach

**Request Body** (optional):
```json
{
  "tone": "friendly"  // or "professional", "empathetic", "concise"
}
```

#### `GET /api/ai/tickets/{ticket_id}/recommendation` - Get Next Best Actions
**Purpose**: AI-recommended actions for resolving ticket

**Flow**:
1. Fetch ticket from PostgreSQL
2. Get customer intelligence from Quimbi AI
3. Call Quimbi AI: `POST /api/generation/actions`
4. Return recommendations with context

**Response**:
```json
{
  "ticket_id": "uuid",
  "actions": [
    {
      "action": "Send immediate replacement with expedited shipping",
      "priority": 1,
      "reasoning": "High-value customer with elevated churn risk",
      "estimated_impact": {
        "retention_probability": 0.85,
        "revenue_at_risk": 780.00
      }
    },
    {
      "action": "Offer 15% discount on next purchase",
      "priority": 2,
      "reasoning": "Long delivery delay may have damaged trust",
      "estimated_impact": {
        "retention_probability": 0.75,
        "cost": 45.00
      }
    }
  ],
  "warnings": [
    "Customer has 222 days since last purchase - lapsed customer, high re-engagement effort needed"
  ],
  "talking_points": [
    "Acknowledge the inconvenience and delay",
    "Reference their loyalty (8 previous orders)",
    "Emphasize immediate resolution steps"
  ],
  "customer_dna": {...},
  "churn_risk": 0.65,
  "revenue_at_risk": 780.00
}
```

#### `GET /api/ai/customers/{customer_id}/intelligence` - Get Customer Intelligence
**Purpose**: Get customer DNA, churn, LTV predictions

**Use Cases**:
- Customer profile views
- Agent context panels
- Pre-call preparation

**Response**:
```json
{
  "customer_id": "uuid",
  "archetype": {
    "archetype_id": "premium_loyalist",
    "dominant_segments": {
      "purchase_value": "premium",
      "purchase_frequency": "regular",
      "price_sensitivity": "full_price"
    }
  },
  "behavioral_metrics": {
    "lifetime_value": 1250.00,
    "total_orders": 8,
    "avg_order_value": 156.25,
    "days_since_last_purchase": 222,
    "customer_tenure_days": 320
  },
  "predictions": {
    "churn_risk": 0.65,
    "churn_risk_level": "high",
    "predicted_ltv_12mo": 450.00
  },
  "communication_guidance": [
    "Use professional, detailed communication",
    "Reference past positive experiences",
    "Offer win-back incentive (15-20% discount recommended)"
  ]
}
```

---

### 3. Agents API (`/api/agents`)

**Authentication**: All endpoints require JWT Bearer token

#### `POST /api/agents/login` - Agent Login
**Purpose**: Authenticate agent and receive JWT token

**Request**:
```json
{
  "email": "agent@company.com",
  "password": "secret"
}
```

**Response**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "agent": {
    "id": "uuid",
    "name": "John Agent",
    "email": "agent@company.com",
    "role": "agent",
    "status": "online"
  }
}
```

#### `GET /api/agents` - List Agents
**Filters**:
- `status` - Filter by agent status (online, busy, away, offline)
- `role` - Filter by role (agent, senior_agent, team_lead, manager, admin)
- `is_active` - Filter by active status
- `available_only` - Only show agents available for assignment

#### `POST /api/agents` - Create Agent
**Permissions**: Admin, Manager only

#### `GET /api/agents/{agent_id}` - Get Agent Details

#### `PATCH /api/agents/{agent_id}` - Update Agent
**Permissions**:
- Agents can update their own status, accepts_new_tickets
- Team Leads+ can update any agent
- Only Admin/Manager can change roles

#### `DELETE /api/agents/{agent_id}` - Deactivate Agent (soft delete)
**Permissions**: Admin, Manager only

**Agent Roles**:
1. `agent` - Standard support agent
2. `senior_agent` - Experienced agent
3. `team_lead` - Manages team of agents
4. `manager` - Department manager
5. `admin` - Full system access

**Agent Statuses**:
- `online` - Active and available
- `busy` - Active but handling tickets
- `away` - Temporarily unavailable
- `offline` - Not working

---

## Data Models

### Ticket
```python
{
  "id": str (UUID),
  "customer_id": str (UUID),
  "channel": "email" | "sms" | "phone" | "chat" | "form",
  "status": "open" | "pending" | "closed",
  "priority": "urgent" | "high" | "normal" | "low",
  "subject": str,
  "customer_sentiment": float (0.0-1.0, 0=negative, 1=positive),
  "estimated_difficulty": float (0.0-1.0),
  "created_at": datetime,
  "updated_at": datetime,
  "assigned_to": str (agent_id) | null,
  "tags": List[str]
}
```

### Customer
```python
{
  "id": str (UUID),
  "name": str,
  "email": str,
  "lifetime_value": Decimal,
  "total_orders": int,
  "churn_risk_score": float (0.0-1.0),
  "created_at": datetime
}
```

### Message
```python
{
  "id": str (UUID),
  "ticket_id": str (UUID),
  "from_agent": bool,
  "content": str,
  "author_name": str,
  "created_at": datetime
}
```

### CustomerProfile (from Quimbi AI)
```python
{
  "customer_id": str,
  "archetype": {
    "archetype_id": str,
    "dominant_segments": {
      "purchase_value": "whale" | "premium" | "mid_tier" | "budget",
      "price_sensitivity": "deal_hunter" | "strategic" | "full_price",
      "purchase_frequency": "power_buyer" | "regular" | "occasional",
      # ... other axes
    },
    "member_count": int,
    "population_percentage": float
  },
  "fuzzy_memberships": {...},
  "business_metrics": {
    "lifetime_value": float,
    "total_orders": int,
    "avg_order_value": float,
    "days_since_last_purchase": int | null,
    "customer_tenure_days": int
  },
  "churn_risk": {
    "risk_level": "critical" | "high" | "medium" | "low",
    "churn_risk_score": float (0-1),
    "factors": {...},
    "recommendation": str
  }
}
```

---

## Integration with Quimbi AI Service

The Customer Support Backend is a **thin orchestration layer** that:
1. Manages ticket data in PostgreSQL
2. Calls Quimbi AI service for intelligence
3. Enriches responses with behavioral context
4. Returns actionable insights to frontend

**Quimbi AI Service Endpoints** (called internally):
- `POST /api/intelligence/analyze` - Get customer DNA from purchase history
- `POST /api/generation/message` - Generate personalized draft response
- `POST /api/generation/actions` - Generate recommended next best actions

---

## Key Features Comparison with Current Frontend

### Features Already in Backend (No Frontend Yet)

1. **Topic Alerts** ✨
   - Backend: `topic_alerts` parameter on `/api/tickets`
   - Frontend: NOT IMPLEMENTED
   - **Action Needed**: Add UI for agents to set alert keywords

2. **Score Breakdown Debug Endpoint** ✨
   - Backend: `/api/tickets/{id}/score-breakdown`
   - Frontend: NOT IMPLEMENTED
   - **Action Needed**: Add debug panel showing why ticket is prioritized

3. **Agent Management** ✨
   - Backend: Full agent CRUD with roles/permissions
   - Frontend: NOT IMPLEMENTED
   - **Action Needed**: Build agent management UI

4. **Regenerate Draft with Tone** ✨
   - Backend: Accepts `tone` parameter
   - Frontend: Dropdown exists but doesn't pass tone to backend
   - **Action Needed**: Fix frontend to pass selected tone

### Features in Both (Need Alignment)

1. **Customer Lifecycle Detection**
   - Frontend: 110 lines of logic in `TicketDetailPage.tsx`
   - Backend: Should come from Quimbi AI `churn_risk` data
   - **Action Needed**: Remove frontend logic, use backend data

2. **Archetype Recommendations**
   - Frontend: 60 lines of hardcoded tips
   - Backend: Should come from AI `/recommendation` endpoint
   - **Action Needed**: Replace frontend logic with API call

3. **Message Splitting**
   - Frontend: 53 lines of sentence boundary logic
   - Backend: None
   - **Action Needed**: Move to Quimbi AI service

---

## Frontend Migration Checklist

### Phase 1: Connect to New Backend API ✅ (CURRENT)
- [ ] Update `API_BASE_URL` to point to Quimbi Backend
- [ ] Add authentication (JWT tokens) to all requests
- [ ] Update TypeScript types to match backend schemas
- [ ] Test ticket list with smart ordering
- [ ] Test ticket detail with customer profile

### Phase 2: Remove Hardcoded Business Logic
- [ ] Delete lifecycle detection logic (use `churn_risk` from API)
- [ ] Delete archetype recommendation logic (use `/recommendation` API)
- [ ] Delete message splitting logic (move to Quimbi AI)
- [ ] Delete ticket prioritization logic (use `smart_score` from API)

### Phase 3: Add New Features
- [ ] Implement Topic Alerts UI (keyword input field)
- [ ] Add Score Breakdown debug panel
- [ ] Build Agent Management UI
- [ ] Fix Regenerate Draft to pass `tone` parameter
- [ ] Add Customer Intelligence panel (call `/ai/customers/{id}/intelligence`)

### Phase 4: Performance & Polish
- [ ] Implement WebSocket for real-time ticket updates
- [ ] Add optimistic UI updates
- [ ] Improve error handling and loading states
- [ ] Add comprehensive tests

---

## Environment Variables

Backend requires these environment variables:

```bash
# Database
DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/quimbi"

# CORS
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# Environment
ENVIRONMENT="development"  # or "production"

# Quimbi AI Service
QUIMBI_AI_URL="http://localhost:9000"  # or production URL
QUIMBI_AI_API_KEY="your-api-key"

# JWT Authentication
JWT_SECRET_KEY="your-secret-key"
JWT_ALGORITHM="HS256"
JWT_EXPIRE_MINUTES=1440  # 24 hours
```

---

## API Rate Limits & Performance

**Current Implementation**: No rate limiting

**Performance Characteristics**:
- Ticket list query: ~50-100ms (with smart scoring)
- Single ticket query: ~20-30ms
- AI draft generation: ~2-5 seconds (depends on Quimbi AI)
- AI recommendations: ~2-5 seconds (depends on Quimbi AI)

**Recommended Optimizations**:
1. Add Redis caching for AI drafts (1-5 minute TTL)
2. Implement pagination for large ticket lists
3. Use database indexes on frequently queried fields
4. Consider read replicas for reporting queries

---

## Security Considerations

**Authentication**: JWT Bearer tokens with 24-hour expiry

**Authorization**: Role-based access control (RBAC)
- Agent: Can view/update assigned tickets
- Senior Agent: Can view all tickets, update any
- Team Lead: + can assign tickets to agents
- Manager: + can create/deactivate agents
- Admin: Full access to all features

**Data Protection**:
- Customer PII stored in PostgreSQL
- Database connections use TLS in production
- CORS restricted to allowed origins
- API keys required for Quimbi AI integration

**Recommended Additions**:
1. API rate limiting (e.g., 100 req/min per agent)
2. Request logging with PII masking
3. Input validation and sanitization
4. SQL injection protection (SQLAlchemy handles this)
5. XSS protection (FastAPI handles this)

---

## Deployment Architecture

**Current Setup**: Single-server deployment

**Recommended Production Architecture**:
```
┌─────────────┐
│   Frontend  │ (Railway / Vercel)
│  React SPA  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────┐
│  Customer Support   │ (Railway / AWS)
│  Backend (FastAPI)  │
└──────┬──────────────┘
       │
       ├───► PostgreSQL (Railway / RDS)
       │
       └───► Quimbi AI Service (separate backend)
             ├─► OpenAI / Anthropic APIs
             └─► Customer Data Warehouse
```

---

## Next Steps

1. **Update Frontend API Client** to match new backend schema
2. **Add Authentication** flow with JWT tokens
3. **Remove Frontend Business Logic** (251 lines to extract)
4. **Implement New Features** (Topic Alerts, Agent Management)
5. **Test E2E Flow** with real customer data
6. **Deploy to Production** with proper environment variables

---

## Questions for Product/Engineering Discussion

1. **Topic Alerts**: Should this be per-agent setting or team-wide?
2. **Agent Permissions**: Do we need more granular permissions than current roles?
3. **AI Draft Caching**: What TTL is acceptable? (impacts cost vs. freshness)
4. **Real-time Updates**: Do we need WebSocket support for live ticket updates?
5. **Analytics**: What metrics should we track? (CSAT, resolution time, etc.)
6. **Multi-tenancy**: Do we need to support multiple organizations on same backend?

---

## Contact & Resources

- **API Docs**: http://localhost:8000/docs
- **Backend Repo**: /Users/scottallen/quimbi-backend
- **Frontend Repo**: /Users/scottallen/front-end_alpha_ecommerce
- **Architecture Plan**: /Users/scottallen/front-end_alpha_ecommerce/ARCHITECTURE_REFACTOR_PLAN.md
