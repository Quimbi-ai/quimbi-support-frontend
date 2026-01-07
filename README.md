# Quimbi Frontend

**Pure React UI for Quimbi Platform** - Customer support, CRM, and marketing acquisition interface

## 🎯 Purpose

Pure frontend React application focused on UI/UX. All business logic resides in backend services.

## 🏗️ Architecture

Consumes APIs from Quimbi backend services:
- **q.ai-customer-support** - Ticket management, prioritization
- **Quimbi AI Backend** (future) - AI response generation
- **Quimbi CRM Backend** (future) - Customer intelligence

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd frontend && npm install

# Start development server
cd frontend && npm run dev
# Runs at http://localhost:5173
```

## 📁 Structure

```
frontend/                   # React app
├── src/
│   ├── pages/             # UI pages (Inbox, Ticket, Customer)
│   ├── components/        # Reusable UI components
│   ├── api/               # API client wrappers
│   └── utils/             # Display formatting
server.js                  # Express static server for production
```

## ✅ What This Does

- ✅ Displays data from backend APIs
- ✅ Captures user input
- ✅ React Router navigation
- ✅ React Query caching
- ✅ Client-side validation
- ✅ Display formatting

## ⛔ What This Does NOT Do

- ❌ Business logic or calculations
- ❌ Score computation
- ❌ Business rules
- ❌ Duplicate backend logic

## 🚢 Deployment

Railway deployment with Express static server.

```bash
railway up
```

## 📖 Related

- [q.ai-customer-support](https://github.com/Quimbi-ai/q.ai-customer-support) - Support backend
- [Architecture Plan](ARCHITECTURE_REFACTOR_PLAN.md) - Full refactor roadmap

## 📄 License

Proprietary - Quimbi.ai
