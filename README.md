# Arcamatrix V2

AI-powered workspace platform where visitors get a **working AI workspace within 30 seconds** — no login required. The demo *is* the product.

## Concept

Every visitor immediately receives a real, temporary AI workspace (sandbox). They can chat with the AI agent, configure tools, and try out features — all without creating an account. Upon signup, the sandbox seamlessly promotes to a permanent workspace. No data is copied or lost.

## Tech Stack

```
React (Vite)      →  UI, routing, signup, animations, workspace shell
    ↕  HTTP / SSE streaming
Mastra (TypeScript) →  Orchestration layer, auth, API routing, sandbox lifecycle
    ↕  MCP protocol (mcp_serve.py) / HTTP
Hermes Agent (Python) →  Agent runtime, tools, memory, messaging gateway
    ↕
LLM Provider       →  OpenRouter / OpenAI / Anthropic (model-agnostic)
```

| Layer | Role |
|-------|------|
| **React** | Landing page, signup flow, workspace UI, SSE streaming display |
| **Mastra** | Sandbox provisioning, auth, API gateway, token budgets, SSE relay |
| **Hermes** | Agent execution, per-user memory, skills system, cron scheduler, messaging gateway |

## Architecture

### Visitor Sandbox Flow

```
Visitor lands on /
  → Mastra creates sandbox (no auth required)
  → Hermes namespace provisioned: /hermes-data/sandbox/{uuid}/
  → Visitor gets a live AI workspace (30-min TTL, extendable)

Upon signup (Google OAuth or magic link):
  → Sandbox promotes to permanent account
  → Namespace renamed, no data copied or lost
  → Same chat, same memory, same settings
```

### Hermes Isolation Model

Shared process with isolated namespaces (lightweight, no cold start per visitor):

```
Hermes daemon (shared)
  ├── namespace: sandbox/abc-123/   ← anonymous visitor
  ├── namespace: sandbox/def-456/   ← anonymous visitor
  ├── namespace: user/user-789/     ← authenticated user
  └── namespace: user/user-012/     ← authenticated user
```

Each namespace has its own `MEMORY.md`, `USER.md`, `sessions/`, and `skills/`.

### Token Budgets

| Tier | Budget | Reset |
|------|--------|-------|
| Sandbox (anonymous) | 5,000 tokens | one-time per sandbox |
| Free account | 25,000 tokens/day | daily at 00:00 UTC |
| Premium | unlimited | — |

## Brain Modules

The workspace includes three Brain modules accessible via the sidebar:

- **Tools** — Connectors (OAuth integrations: Gmail, Calendar, GitHub, etc.) and Skills (166+ procedural knowledge blocks, self-improving)
- **Knowledge** — Agent identity/persona (`IDENTITY.md`), user profile (`USER.md`), and uploaded knowledge files with embeddings
- **Memory** — Persistent factual memory (`MEMORY.md`) with automatic extraction from conversations

## API Endpoints

### Sandbox
- `POST /sandbox/create` — Create anonymous sandbox
- `POST /sandbox/heartbeat` — Extend TTL
- `POST /sandbox/promote` — Promote sandbox to permanent account

### Auth
- `POST /auth/google` — Google OAuth
- `POST /auth/email/start` — Magic link
- `POST /auth/email/verify` — Verify magic link token

### Streaming
- `GET /stream/:session_id` — SSE stream (Hermes output + token usage events)

### Brain
- `GET/PUT /brain/knowledge/identity` — Agent identity
- `GET/POST /brain/knowledge/files` — Knowledge files
- `GET/POST/PATCH/DELETE /brain/memory` — Memory management
- `GET/POST/DELETE /skills/*` — Skills management
- `GET/POST/DELETE /connectors/*` — OAuth connectors

## Project Structure

```
frontend/          → React app (Vite + Zustand)
Planning/          → Phase plans and architecture docs
```

## Key Technical Decisions

| Decision | Choice |
|----------|--------|
| Frontend framework | React (not Next.js) |
| Build tool | Vite |
| State management | Zustand (always via custom hooks) |
| Hermes integration | MCP via `mcp_serve.py` |
| Hermes isolation | Shared process, namespace isolation |
| Landing page demo | Live sandbox (not pre-scripted) |
| Demo cut-off | Scenario-driven + max-messages fallback |

## Development

```bash
cd frontend
npm install
npm run dev
```

## GDPR & Data

- All user data stored on EU servers
- Sandbox data is anonymous — auto-deleted after TTL if not promoted
- Promoted workspaces follow standard user data policies
- `DELETE /account` removes all Hermes workspace data
- Hermes memory files are plaintext Markdown — fully transparent

## Phase 1 Status

Phase 1 delivers: landing page, free account onboarding, Brain modules, and visitor sandbox.

**Completed:**
- F-01 LandingPage component
- F-02 SignupPanel component
- F-05 ChatMessage components
- F-06 MorphButton component
- F-07 SSE streaming consumer hook
- B-01 Auth endpoints (frontend stub)
- B-04 SSE streaming pipeline (local demo)

**In progress:**
- B-03 Mastra-Hermes MCP bridge
- F-04 SandboxWorkspace (shell built, live integration pending)
- B-05 Token rate limiting (local stub live)

**Upcoming:**
- F-03 Sidebar + Brain UI
- F-09 Routing
- F-10 Mobile layout
- B-02 Sandbox provisioning
- B-06 Hermes namespace isolation
- B-07 Messaging gateway (WhatsApp/Telegram)
- B-08 GDPR compliance
