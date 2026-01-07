# Frontend/Backend Architecture Refactor Plan

## 🎯 Vision: Clean Separation of Concerns

**Frontend (React)**: Pure UI/UX focused on functionality, displays data from backends
**Backends**: Business logic, AI capabilities, data intelligence - centralized and reusable

---

## 📊 Current State Analysis

### ✅ What's Already Pure Frontend (Keep As-Is)
- **UI Components**: Pages, cards, buttons, badges, layouts
- **Routing**: React Router navigation
- **State Management**: React Query caching, localStorage for preferences
- **Display Logic**: Date/currency formatting, badge colors, status indicators
- **Client Validation**: Form validation before API submission
- **UX Optimizations**: Loading states, optimistic updates

### ⚠️ Business Logic Currently in Frontend (Must Extract)

#### 1. **Archetype Recommendations**
- **Location**: `frontend/src/pages/TicketDetailPage.tsx:247-357`
- **Size**: 110 lines of business rules
- **What it does**: Analyzes 8 behavioral dimensions + churn + lifecycle to generate action recommendations
- **Problem**: Hardcoded discount amounts, thresholds, business rules
- **Should be**: Backend API returning context-aware recommendations

#### 2. **Ticket Prioritization Rules**
- **Location**: `frontend/src/pages/InboxPage.tsx:48-107`
- **Size**: 60 lines of scoring logic
- **What it does**: Applies keyword-based rules to boost ticket scores
- **Problem**: Business rules in client, limited access to customer data
- **Should be**: Backend applying rules with full customer context

#### 3. **Message Splitting (Channel Formatting)**
- **Location**: `frontend/src/pages/TicketDetailPage.tsx:87-139`
- **Size**: 53 lines of sentence boundary detection
- **What it does**: Splits AI responses for SMS (160 chars) / Chat (400 chars)
- **Problem**: Channel formatting is business logic, not UI
- **Should be**: AI backend returns pre-formatted messages per channel

#### 4. **Customer Lifecycle Detection**
- **Location**: `frontend/src/pages/TicketDetailPage.tsx:327-354`
- **Size**: 28 lines of lifecycle rules
- **What it does**: Determines if customer is new, lapsed, at-risk based on recency/frequency
- **Problem**: Business thresholds (90 days, 180 days) hardcoded
- **Should be**: Customer profile includes computed lifecycle_stage

---

## 🏗️ Target Architecture: 4 Backend Services

### 1. **Quimbi AI Backend** (Core AI Engine)
**Repo**: `quimbi-ai-backend`
**Technology**: Python + FastAPI + LangChain/OpenAI
**Responsibilities**:
- LLM orchestration (GPT-4, Claude, etc.)
- Prompt engineering & management
- Response generation with tone/style control
- Channel-aware formatting (SMS/Chat/Email)
- Multi-message splitting for character limits
- Personalization based on customer context
- Template management

**Key APIs**:
```
POST /api/v1/generate-response
  Body: {
    ticket_id, customer_id, conversation_history,
    tone: "friendly" | "professional" | "empathetic" | "apologetic",
    channel: "sms" | "chat" | "email",
    include_offer: boolean,
    customer_context: { segments, churn_risk, ltv, lifecycle_stage }
  }
  Response: {
    messages: ["msg1", "msg2"],  // Pre-split for channel
    personalization_applied: ["referenced_past_purchase", "used_customer_name"],
    confidence: 0.95
  }

POST /api/v1/regenerate
  - Same params, different style/tone

GET /api/v1/templates
  - Response templates by use case
```

---

### 2. **Customer Support Backend**
**Repo**: `quimbi-support-backend`
**Technology**: Python/Node + FastAPI/Express
**Responsibilities**:
- Ticket CRUD operations
- Message threading & history
- Ticket assignment & routing
- Status management (open/pending/closed)
- SLA tracking & escalation rules
- Internal notes & collaboration
- Ticket search & filtering
- Integration with Gorgias/Zendesk/etc.

**Key APIs**:
```
GET /api/v1/tickets
  Query: { status, priority, assigned_to, topic_alerts, apply_rules: true }
  Response: {
    tickets: [{
      id, subject, status, priority,
      customer_id, assigned_to,
      smart_score, // If apply_rules=true, score with rules applied
      last_message_preview,
      created_at, updated_at
    }]
  }

GET /api/v1/tickets/{id}
  Response: { ticket with full messages, customer_profile }

POST /api/v1/tickets/{id}/messages
  Body: { content, from_agent, author_name }

PATCH /api/v1/tickets/{id}
  Body: { status, priority, assigned_to }

POST /api/v1/tickets/{id}/reset
  - Creates duplicate with only initial message (for demos)

POST /api/v1/tickets/prioritize
  Body: { ticket_ids, rule_ids }
  - Applies prioritization rules server-side
```

---

### 3. **CRM/Customer Intelligence Backend**
**Repo**: `quimbi-crm-backend`
**Technology**: Python + FastAPI + ML libraries
**Responsibilities**:
- Customer profile aggregation (Shopify + interactions)
- **8 Behavioral Dimensions**:
  1. Purchase Value (whale, premium, mid_tier, budget)
  2. Price Sensitivity (deal_hunter, strategic, full_price)
  3. Purchase Frequency (power_buyer, regular, occasional)
  4. Shopping Cadence (weekend_crafter, seasonal, weekday)
  5. Return Behavior (frequent_returner, careful_buyer)
  6. Category Affinity (multi_category, category_loyal)
  7. Shopping Maturity (long_term, established, developing, new)
  8. Lifecycle Stage (new, active, at_risk, lapsed, churned)
- Churn risk scoring
- LTV calculation & prediction
- Next-best-action recommendations
- **Role-based insights** (5 for Support, 8 for Marketing)

**Key APIs**:
```
GET /api/v1/customers/{id}
  Response: {
    id, name, email,
    business_metrics: { ltv, total_orders, avg_order_value, days_since_last_purchase },
    archetype: {
      name: "Strategic Weekend Crafter",
      dominant_segments: {
        purchase_value: "premium",
        price_sensitivity: "strategic",
        purchase_frequency: "regular",
        shopping_cadence: "weekend_crafter",
        return_behavior: "careful_buyer",
        category_affinity: "category_loyal",
        shopping_maturity: "established",
        lifecycle_stage: "active"
      }
    },
    churn_risk: { score: 0.32, factors: ["declining_frequency"] }
  }

GET /api/v1/customers/{id}/recommendations
  Query: { context: "support" | "marketing" }
  Response: {
    recommendations: [
      {
        dimension: "churn_risk",
        insight: "⚠️ Moderate churn risk",
        action: "Offer 10% discount or free shipping",
        priority: 1
      },
      {
        dimension: "purchase_value",
        insight: "💎 Solid customer",
        action: "Good for 10-15% discount if needed",
        priority: 2
      }
      // Support context: 5 dimensions
      // Marketing context: 8 dimensions
    ],
    suggested_discount_range: { min: 10, max: 15 },
    shipping_recommendation: "offer_expedited_at_discount"
  }

GET /api/v1/segments
  - Available segment definitions & thresholds

POST /api/v1/customers/{id}/recalculate
  - Trigger re-segmentation (webhook from Shopify)
```

---

### 4. **Marketing Acquisition Backend** (Future)
**Repo**: `quimbi-marketing-backend`
**Technology**: Python + FastAPI
**Responsibilities**:
- Campaign management
- Audience segmentation & targeting
- Attribution tracking
- Lead scoring
- Email/SMS campaign execution
- A/B testing framework
- ROI analytics

**Key APIs**: (To be designed)

---

## 🔀 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  - UI/UX only                                              │
│  - Displays data from backends                             │
│  - No business logic                                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ API Gateway / BFF (Future)
                │
        ┌───────┴───────┬──────────┬──────────────┐
        │               │          │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─▼────────┐ ┌───▼──────────┐
│  Quimbi AI   │ │  Support  │ │   CRM    │ │   Marketing  │
│   Backend    │ │  Backend  │ │ Backend  │ │   Backend    │
│              │ │           │ │          │ │   (Future)   │
│ - LLM Gen    │ │ - Tickets │ │ - Segm.  │ │              │
│ - Formatting │ │ - Messages│ │ - Churn  │ │              │
│ - Personaliz.│ │ - Rules   │ │ - LTV    │ │              │
└──────────────┘ └───────────┘ └──────────┘ └──────────────┘
        │               │           │
        └───────────────┴───────────┘
                        │
              ┌─────────▼─────────┐
              │  Shopify / Data   │
              │    Sources        │
              └───────────────────┘
```

---

## 📋 Implementation Plan

### **Phase 1: Architecture Design** (Week 1)
- [ ] Create API contracts (OpenAPI specs) for all 4 backends
- [ ] Design authentication/authorization strategy (JWT, API keys)
- [ ] Define data models & shared schemas
- [ ] Design inter-service communication patterns
- [ ] Set up repos: `quimbi-ai-backend`, `quimbi-support-backend`, `quimbi-crm-backend`

### **Phase 2: CRM Backend - Customer Intelligence** (Week 2)
- [ ] Migrate 8 behavioral dimension logic from frontend
- [ ] Implement customer profile aggregation
- [ ] Build churn risk scoring engine
- [ ] Create lifecycle stage calculator (new, active, at_risk, lapsed)
- [ ] Implement `GET /customers/{id}` endpoint
- [ ] Implement `GET /customers/{id}/recommendations?context=support|marketing`
- [ ] Role-based filtering (5 dimensions for support, 8 for marketing)

### **Phase 3: Support Backend - Ticket Management** (Week 3)
- [ ] Migrate ticket CRUD operations
- [ ] Implement prioritization rules engine (server-side)
- [ ] Build `POST /tickets/prioritize` endpoint
- [ ] Create ticket reset/duplicate functionality
- [ ] Implement topic alerts filtering
- [ ] Integration with existing Gorgias backend

### **Phase 4: Quimbi AI Backend - Response Generation** (Week 4)
- [ ] Set up LLM orchestration (OpenAI/Claude)
- [ ] Implement tone/style control
- [ ] Build channel-aware formatting (SMS/Chat/Email)
- [ ] Migrate message splitting logic from frontend
- [ ] Create `POST /generate-response` endpoint
- [ ] Implement personalization engine
- [ ] Template management system

### **Phase 5: Frontend Refactor** (Week 5)
- [ ] Remove `getArchetypeRecommendation()` function
- [ ] Remove `applyRulesToTickets()` function
- [ ] Remove `splitMessageOnSentences()` function
- [ ] Update `TicketDetailPage` to call CRM backend for recommendations
- [ ] Update `InboxPage` to use backend prioritization
- [ ] Update AI response flow to use formatted messages from backend
- [ ] Display lifecycle_stage from customer profile
- [ ] Simplify frontend to pure UI components

### **Phase 6: Authentication & Security** (Week 6)
- [ ] Implement JWT-based auth across all backends
- [ ] Set up API gateway or BFF pattern
- [ ] Define user roles (support_agent, marketing_manager, admin)
- [ ] Implement role-based access control
- [ ] Secure inter-service communication
- [ ] API rate limiting

### **Phase 7: Testing & Deployment** (Week 7)
- [ ] Write integration tests for all backends
- [ ] End-to-end testing of full flow
- [ ] Set up CI/CD for all repos
- [ ] Deploy backends to Railway/AWS/GCP
- [ ] Update frontend to point to production backends
- [ ] Monitor & optimize performance

---

## 🗂️ Repository Structure

```
quimbi-platform/
├── quimbi-frontend/              # React app (this repo, renamed)
│   ├── src/
│   │   ├── pages/                # Pure UI pages
│   │   ├── components/           # UI components only
│   │   ├── api/                  # API client wrappers
│   │   └── utils/                # Display formatting only
│   └── package.json
│
├── quimbi-ai-backend/            # AI/LLM service
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   ├── services/llm.py
│   │   ├── services/formatting.py
│   │   └── services/personalization.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── quimbi-support-backend/       # Ticket management
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   ├── services/tickets.py
│   │   ├── services/prioritization.py
│   │   └── models/
│   ├── requirements.txt
│   └── Dockerfile
│
├── quimbi-crm-backend/           # Customer intelligence
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   ├── services/segmentation.py
│   │   ├── services/churn.py
│   │   ├── services/recommendations.py
│   │   └── ml/models/
│   ├── requirements.txt
│   └── Dockerfile
│
└── quimbi-marketing-backend/     # Marketing (future)
    └── (TBD)
```

---

## 🔑 Key Decisions

### 1. **Role-Based Recommendations**
- Support agents see **5 dimensions**: churn_risk, purchase_value, price_sensitivity, purchase_frequency, lifecycle_stage
- Marketing managers see **8 dimensions**: all of the above + shopping_cadence, return_behavior, category_affinity, shopping_maturity
- Backend determines user role and filters response accordingly

### 2. **Message Formatting**
- AI backend owns channel formatting logic
- Returns pre-split messages: `{ messages: ["part1", "part2"] }`
- Frontend just displays the array of messages

### 3. **Ticket Prioritization**
- Rules stored and applied server-side
- Frontend sends `?apply_rules=true` to get sorted results
- UI shows visual indicators (↑ badge) but doesn't calculate

### 4. **Customer Data**
- CRM backend is source of truth for customer intelligence
- Other backends call CRM for customer context
- Cached appropriately to minimize inter-service calls

---

## 📊 Success Metrics

- [ ] **Zero business logic in React frontend** (only UI/display code)
- [ ] **Consistent recommendations** across all products
- [ ] **Centralized rule updates** (change in one place, applies everywhere)
- [ ] **Role-based access** (support sees 5, marketing sees 8)
- [ ] **Reusable backends** for future products (SMS campaigns, etc.)
- [ ] **Improved testability** (business logic has unit tests)
- [ ] **Better performance** (backend caching, optimized queries)

---

## 🚀 Quick Start (After Refactor)

```bash
# Clone all repos
git clone quimbi-frontend
git clone quimbi-ai-backend
git clone quimbi-support-backend
git clone quimbi-crm-backend

# Start backends
cd quimbi-ai-backend && docker-compose up
cd quimbi-support-backend && docker-compose up
cd quimbi-crm-backend && docker-compose up

# Start frontend
cd quimbi-frontend
npm install
npm run dev
# Frontend at http://localhost:5173
# Calls backends at :8001 (AI), :8002 (Support), :8003 (CRM)
```

---

## 📝 Next Steps

1. Review this plan with team
2. Create detailed API contracts for each backend
3. Set up new repos with basic FastAPI scaffolding
4. Start with CRM backend (highest value - removes most frontend logic)
5. Iteratively migrate logic and update frontend
6. Deploy progressively (CRM first, then Support, then AI)
