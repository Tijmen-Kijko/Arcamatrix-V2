# Arcamatrix — Masterplan
**Landing page · Free account onboarding · Visitor Sandbox · Workspace**
*Stack: React · Mastra (TypeScript) · Hermes Agent (Python) | Bijgewerkt: 8 april 2026*

---

## Doel

Één duidelijk resultaat: een nieuwe bezoeker landt op de site en heeft **binnen 30 seconden een werkende AI-workspace** — zonder login, zonder uitleg vooraf. De bezoeker krijgt meteen een echte sandbox-omgeving. De demo *is* het product. Bij signup wordt de sandbox naadloos gepromoveerd naar een permanent account.

---

## Stack-overzicht

```
[React]  →  UI, routing, signup form, animaties, workspace shell
    ↕  HTTP / SSE streaming
[Mastra]  →  TypeScript orchestratielaag, auth, API routing, sandbox lifecycle, agent workflows
    ↕  MCP protocol (via mcp_serve.py) / HTTP
[Hermes Agent]  →  Python agent runtime, tools, memory, messaging gateway
    ↕
[LLM Provider]  →  OpenRouter / OpenAI / Anthropic (model-agnostisch)
```

**Hermes** (30k stars, v0.7.0, MIT) is de daadwerkelijke agent-engine: 40+ tools, zelfverbeterend skills-systeem, persistent memory per gebruiker, ingebouwde cron-scheduler, en een gateway voor Telegram/WhatsApp/Discord.

**Mastra** is de TypeScript-brug: beheert auth, user-sessions, sandbox lifecycle, API-endpoints, en orkestreert wanneer Hermes wordt aangeroepen.

---

## Sidebar-structuur — Definitief (8 april 2026)

```
┌─ New chat                          ← altijd zichtbaar, bovenaan
├─ Tools ▾                           ← uitklapbaar
│   ├── Integrations
│   └── Skills
├─ Secrets                           ← direct nav-item
├─ Daily Tasks ▾                     ← uitklapbaar
│   ├── Tasks
│   ├── Files
│   └── Chats
├─ Projects ▾                        ← uitklapbaar
│   └── [Project naam] ▾
│       ├── Tasks
│       ├── Files
│       └── Chats
├─ Channels                          ← altijd zichtbaar, NIET opvouwbaar
│   (gekleurde dot per channel)
└─ ─────────────────────────────────
   Account & Billing
   API
   Log out
```

**Sidebar is inklapbaar:** breed (240px) ↔ smal (52px, alleen iconen).
**Kleurstijl:** donker warm bruin/zwart (`#0f0d0b` bg, `#161412` surface), amber/goud accent (`#c8a96e`), Inter font.
**Referentie:** `arcamatrix-sidebar.html` (gebouwd 8 april 2026).

### Brain → Knowledge / Memory: Optie B besloten (8 april 2026)

Brain-configuratie (Identity, Soul, User-profiel, Knowledge Files, Memory) leeft **niet** in de sidebar, maar op de **Account-pagina** als eigen tabbladen.

```
Account-pagina tabs:
  Profiel    → USER.md (naam, aanspreekvorm, voornaamwoorden)
  Brain      → Identity (IDENTITY.md) · Soul (SOUL.md) · Knowledge Files · Memory
  Billing    → token-gebruik, plan, upgrade
  API        → API keys beheren
```

---

## Architectuur per laag

### React (Frontend)

Verantwoordelijk voor:
- Landing page + signup flow (geanimeerde split-screen ervaring)
- Workspace UI shell (sidebar conform bovenstaande structuur, chat interface)
- Account-pagina met Brain-configuratie (Identity, Soul, User-profiel, Knowledge, Memory)
- Streaming output weergeven (SSE → typewriter-effect)
- State: sandbox-status, login-status, workspace-status, chat-sessie

### Mastra (Backend-TS)

Verantwoordelijk voor:
- Sandbox provisioning bij page load (vóór auth)
- Auth endpoints (Google OAuth, magic link)
- User + workspace provisioning bij signup (sandbox promote)
- API gateway tussen React en Hermes
- Token counting / rate limiting (5K sandbox · 25K/dag gratis · onbeperkt premium)
- SSE streaming van Hermes output → React
- Encrypted opslag van connector-tokens en secrets per user

### Hermes Agent (Backend-Python)

Verantwoordelijk voor:
- Daadwerkelijke agent-uitvoering (tool calls, reasoning loop)
- Geïsoleerde namespaces per sandbox + per user
- Per-user memory (MEMORY.md, USER.md — geïsoleerd per workspace)
- Skills systeem (zelfverbeterende procedurele kennis)
- Cron scheduler (geautomatiseerde taken)
- Messaging gateway (WhatsApp, Telegram)

---

## Visitor Sandbox — Kernarchitectuur

### Concept

Elke bezoeker krijgt **meteen een echte, tijdelijke Hermes-workspace** — zonder account, zonder login. Ze kunnen direct chatten, de agent configureren en tools uitproberen. Bij signup wordt de sandbox naadloos gepromoveerd naar een permanent account. Geen pre-scripted animatie — het **is** het product.

### Sandbox Lifecycle

```
Bezoeker landt op /
  │
  ├── Mastra: POST /sandbox/create
  │     → genereert sandbox_id (UUID, geen user_id)
  │     → start Hermes namespace: /hermes-data/sandbox/{sandbox_id}/
  │     → TTL: 30 minuten (verlengbaar bij activiteit)
  │     → slaat sandbox_id op in cookie (httpOnly, SameSite=Strict)
  │     → return: { sandbox_id, session_id, expires_at, token_budget: 5000 }
  │
  ├── React: mount WorkspaceApp met sandbox-sessie
  │     → identieke UI als echte workspace
  │     → chat is live Hermes (geen pre-script)
  │
  └── Bezoeker werkt in de sandbox...

Bij signup (Google OAuth of email):
  │
  └── POST /sandbox/promote
        body: { sandbox_id, auth_token }
        → Valideer auth_token → haal user_id op
        → Schrijf binding in DB: sandbox_id → user_id
        → Verwijder TTL timer (sandbox vervalt niet meer)
        → Rename namespace: /hermes-data/sandbox/{id}/ → /hermes-data/{user_id}/
        → cookie vervangen door permanente auth-token
        → return: { workspace_id: sandbox_id, promoted: true }

        Geen data gekopieerd of verloren — de workspace wás al de demo.
```

### Token-budgetten

| Tier | Budget | Reset |
|------|--------|-------|
| Sandbox (anoniem) | 5.000 tokens | eenmalig per sandbox |
| Gratis account | 25.000 tokens | per dag (reset 00:00 UTC) |
| Premium | onbeperkt | — |

### Hermes Isolatie-model

Gekozen model: **optie B — gedeeld proces, geïsoleerde namespaces**.

```
Hermes daemon (gedeeld)
  ├── namespace: sandbox/abc-123/   ← bezoeker 1
  ├── namespace: sandbox/def-456/   ← bezoeker 2
  ├── namespace: user/user-789/     ← ingelogde user
  └── namespace: user/user-012/     ← ingelogde user
```

---

## Beslissingen

| # | Vraag | Status | Keuze |
|---|-------|--------|-------|
| 1 | Email-auth: magic link of wachtwoord? | 🔲 Open | — |
| 2 | Welk openingsbericht toont de sandbox bij eerste load? | 🔲 Open | — |
| 3 | Bestaande codebase: React of Next.js? | ✅ Besloten | **React** |
| 4 | Hosting EU: Fly.io, Railway, of eigen infra? | 🔲 Open | — |
| 5 | Analytics na signup: Posthog, Mixpanel of niets? | 🔲 Open | — |
| 6 | Hermes–Mastra integratie: MCP, HTTP of gateway? | ✅ Besloten | **MCP via `mcp_serve.py`** |
| 7 | Hermes isolatie per user: eigen proces, namespace of serverless? | ✅ Besloten | **Namespace-model (gedeeld proces)** |
| 8 | Landing page: live sandbox of pre-scripted animatie? | ✅ Besloten | **Live sandbox** |
| 8b | Demo cut-off: wanneer stopt de live sessie? | ✅ Besloten | **Scenario-driven** (+ max-berichten fallback) |
| 9 | LLM provider voor Hermes: OpenRouter, OpenAI of Anthropic? | 🔲 Open | — |
| 10 | Hermes gateway: ingebouwd of eigen WhatsApp/Telegram integratie? | 🔲 Open | — |
| 11 | Build tool: Vite of CRA? | ✅ Besloten | **Vite** |
| 12 | State management: Zustand, Context API of iets anders? | ✅ Besloten | **Zustand** (altijd via custom hooks) |
| 13 | Knowledge embeddings: lokaal (FAISS) of hosted (Pinecone)? | 🔲 Open | — |
| 14 | Memory-extractie: automatisch na sessie of opt-in? | 🔲 Open | — |
| 15 | Skills-registry: eigen hosted of Hermes community? | 🔲 Open | — |
| 16 | Sandbox promote-flow UI: modal, inline of aparte pagina? | 🔲 Open | — |
| 17 | Brain-locatie in UI: sidebar of Account-pagina? | ✅ Besloten | **Account-pagina (Optie B)** |
| 18 | Building project tasks: apart scherm of geïntegreerd in sidebar? | ✅ Besloten | **Eigen "Projects" nav-item in sidebar, los van Brain-modules** |
| 19 | Drag-and-drop voor status-wijziging op het taskboard? | 🔲 Open (Fase B) | — |
| 20 | Koppeling met externe task-tools (Jira, Linear, GitHub Issues)? | 🔲 Open (Fase D) | — |
| 21 | TTS-provider voor Sages: OpenAI TTS, ElevenLabs of browser-native? | 🔲 Open | — |
| 22 | Stem-keuze: vaste Arcamatrix-stem of instelbaar per gebruiker? | 🔲 Open | — |
| 23 | Gesprekstranscriptie in chat: altijd zichtbaar of opt-in? | 🔲 Open | — |
| 24 | Sages in sandbox: volledig blokkeren of signup-prompt na 3 sec? | ✅ Besloten | **Signup-prompt na 3 sec** |

---

## Frontend Tickets

> **Referentie voor alle frontend-tickets:** `arcamatrix-v2.html` (timing) + `arcamatrix-sidebar.html` (sidebar structuur & stijl).
>
> Timingwaarden (gebruik letterlijk — niet aanpassen):
> ```
> Left panel transition:   750ms cubic-bezier(0.16, 1, 0.3, 1)
> Signup fade-out:         350ms ease
> Sidebar fade-in:         450ms ease, delay 400ms
> Window border-radius:    750ms cubic-bezier(0.16, 1, 0.3, 1)
> MorphButton groei:       900ms cubic-bezier(0.16, 1, 0.3, 1)
> MorphButton tekst:       350ms ease, delay 500ms
> Bericht reveal:          380ms ease (opacity + translateY 6px)
> ```
>
> **State management:** Zustand altijd via custom hooks — nooit direct `useStore()` in componenten.

---

### F-01 · LandingPage component ✅
**Week:** 1 | **Status:** Afgerond (7 april 2026)

Split-screen layout, volledig responsive. Route `/` — redirect naar `/workspace` als al ingelogd of sandbox actief.

```
<LandingLayout>
  <SignupPanel />         ← links, sticky, 420px
  <SandboxWorkspace />    ← rechts, live Hermes sandbox
</LandingLayout>
```

---

### F-02 · SignupPanel component ✅
**Week:** 1 | **Status:** Afgerond (7 april 2026)

States: `default → transitioning → workspace`. CSS-transitie: signup (420px) → sidebar (220px) over `750ms cubic-bezier(0.16, 1, 0.3, 1)`.

---

### F-03 · WorkspaceSidebar component
**Week:** 3 | **Afhankelijk van:** F-01, F-09

Sidebar conform `arcamatrix-sidebar.html` (8 april 2026). Definitieve structuur:

- **New chat** — bovenaan
- **Tools** — uitklapbaar (Integrations, Skills)
- **Secrets** — direct item
- **Daily Tasks** — uitklapbaar (Tasks, Files, Chats)
- **Projects** — uitklapbaar, per project ook (Tasks, Files, Chats)
- **Channels** — altijd zichtbaar, NIET opvouwbaar
- **Footer** — Account & Billing · API · Log out

Inklapbaar: breed (240px) ↔ smal (52px). Fade-in animatie: `450ms ease, delay 400ms`.

---

### F-04 · SandboxWorkspace component
**Week:** 1 (shell) + 2 (live SSE) + 3 (transitie-animaties) | **Afhankelijk van:** F-01, B-02, B-04

```
States: loading → active → budget_warning → promote_prompt → workspace

Sub-componenten:
  <WorkspaceWindow />   ← macOS-stijl venster
  <ChatArea />          ← scrollbare berichten (live Hermes via sandbox)
  <InputBar />          ← inputveld + MorphButton
  <BudgetBar />         ← subtiele token-indicator
```

MorphButton trigger: na eerste Hermes-response (niet na demo-script — F-08 vervalt).

---

### F-05 · ChatMessage componenten ✅
**Week:** 1-2 | **Status:** Afgerond (7 april 2026)

Alle berichttypes: `user`, `ai-status` (pulserende groene dot), `ai-pills`, `ai-brief` (typewriter), `ai-text`, `budget-warning`.
Reveal: `opacity 0→1` + `translateY(6px→0)` over `380ms ease`.

---

### F-06 · MorphButton component ✅
**Week:** 1-2 | **Status:** Afgerond (7 april 2026)

States: `send (34×34px) → morphing → cta (196px) → reset`. Trigger: `onFirstResponse()` callback + 1400ms delay.

---

### F-07 · SSE streaming consumer hook ✅
**Week:** 1 | **Status:** Afgerond met mock/stub (7 april 2026)

```typescript
export const useSandboxStream = (sandbox_id: string) => ({
  messages: Message[];
  status: 'idle' | 'streaming' | 'done' | 'error';
  tokenUsage: { used: number; limit: number };
});
```

`USE_LIVE_STREAM` flag switcht naar echte EventSource zodra B-04 draait.

---

### ~~F-08 · Demo trigger configuratie~~ — VERVALLEN
Reden: live sandbox, geen pre-scripted demo meer.

---

### F-09 · Routing
**Week:** 3 | **Afhankelijk van:** F-01, F-03, B-01

```
/           → LandingPage
/workspace  → WorkspaceApp
/account    → Account-pagina (Profiel / Brain / Billing / API)
/tasks      → Daily Tasks
/projects   → Projects overzicht
```

React Router v6.

---

### F-10 · Mobile layout
**Week:** 4 | **Afhankelijk van:** F-01 t/m F-09

Breakpoint < 800px: stacked (form bovenaan, sandbox eronder).

---

### F-11 · Tools → Integrations (connector cards)
**Week:** 3-4 | **Locatie:** Workspace sidebar → Tools → Integrations

OAuth-flow per provider, Connected badge, connector cards. Fase A: read-only.

#### F-11b · Integrations Backend-sectie ✅
**Status:** Afgerond (8 april 2026) | **NIET IN ORIGINEEL PLAN — achteraf gedocumenteerd**

Collapsible "Backend" sectie bovenaan de Integrations-pagina met vier sub-items:
- **Data & Entities** — database-achtige opslag
- **Backend Functions** — serverless functies
- **File Storage** — bestandsbeheer
- **Automations** — backend workflows

Deze sectie positioneert Arcamatrix als meer dan alleen OAuth-connectors — het toont een volledige backend-as-a-service laag. Momenteel UI-only (geen backend-endpoints).

---

### F-12 · Tools → Skills (browse + install)
**Week:** 3-4 | **Locatie:** Workspace sidebar → Tools → Skills

Skill-cards, zoekbalk, install-flow, geïnstalleerd overzicht + toggle.

---

### F-13 · Secrets
**Week:** 3 | **Locatie:** Workspace sidebar → Secrets (direct item)
**NIEUW — stond niet in origineel masterplan**

Encrypted key/value store per user. UI: lijst van secrets (naam + masked waarde), `+ Add secret`, delete.

---

### F-14 · Projects
**Week:** 3-4 | **Locatie:** Workspace sidebar → Projects
**NIEUW — stond niet in origineel masterplan**

Project CRUD: aanmaken, hernoemen, verwijderen. Per project uitklapbaar met eigen Tasks / Files / Chats.

---

### F-15 · Account-pagina
**Week:** 3-4 | **Locatie:** `/account`
**NIEUW — vervangt Brain-tabs in sidebar**

Tabbladen:
- **Profiel** — USER.md (naam, aanspreekvorm, voornaamwoorden)
- **Brain** — Identity (IDENTITY.md) · Soul (SOUL.md) · Knowledge Files · Memory
- **Billing** — token-gebruik, plan, upgrade
- **API** — API keys beheren

Bevat de functionaliteit die eerder als F-11 t/m F-17 (Brain UI in sidebar) was gespecificeerd.

---

### F-16 · Visual Split View ("Bouw modus")
**Week:** 3 | **Afhankelijk van:** F-03, F-04, F-07, B-04

**Concept:** Wanneer Arcamatrix detecteert dat een gebruiker een project wil bouwen, stelt het één contextuele vraag:
> *"Wil je visuals hierbij? Dan open ik een preview-scherm rechts zodat je live kan meekijken terwijl we bouwen."*

Bij bevestiging verschuift de chat naar een smalle sidebar-positie (280px) en opent rechts een live preview-paneel. De gebruiker praat gewoon verder met Arcamatrix terwijl hij de app ziet groeien.

**Trigger:** SSE event `{ type: "open_split_view" }` via `useHermesStream`.

**Transitie (3 fasen):**
1. Chat krimpt naar 280px (480ms, `cubic-bezier(0.16, 1, 0.3, 1)`)
2. Preview schuift in vanuit rechts (520ms, delay 200ms)
3. Toolbar fade-in (300ms, delay 500ms)

**Layout in split-modus:**
```
┌──────────┬──────────┬────────────────────────────────────────────┐
│ Sidebar  │  Chat    │  Preview                                   │
│ 234px    │  280px   │  flex-1                                    │
│          │  resize  │  toolbar: url-balk, device-toggle, reload  │
│          │          │  iframe srcdoc (debounced 400ms)           │
└──────────┴──────────┴────────────────────────────────────────────┘
```

**Preview-rendering:**
- Arcamatrix streamt complete HTML/CSS/JS als antwoord
- SSE events `{ type: "preview_update", html: "..." }` updaten de iframe
- `<iframe srcdoc>` bijgewerkt per significante chunk (debounced 400ms)
- Skeleton-loader in iframe zolang eerste output nog niet binnenkomt

**Terugschakelen:** `×` in preview-toolbar → chat herstelt naar volledig scherm (380ms inverse transitie)

**State:** `workspaceLayoutStore` (Zustand) — `layout: 'chat-only' | 'split-view'`, `previewHtml: string | null`

**Huidige status (8 april 2026):**
- ✅ F-16a: `PreviewPanel` component + toolbar (device toggle, refresh, close)
- ✅ F-16b: iframe srcdoc + 400ms debounce
- ✅ F-16c: `workspaceLayoutStore` Zustand store + hooks (`useIsSplitView`, `usePreviewHtml`, `useUpdatePreview`)
- ✅ Handmatige trigger: "Open preview" knop in ProjectGroup sidebar → toont placeholder HTML per project
- 🔲 F-16d: SSE event routing (`open_split_view` + `preview_update`) — wacht op B-04 + B-16

**Wat werkt nu:** Klik op het monitor-icoon naast een project → split view opent met placeholder (projectnaam + "wacht op build"). Zodra de backend `preview_update` SSE events streamt, wordt de placeholder automatisch vervangen door live HTML.

**Sub-tickets:**

| Ticket | Omschrijving | Status | Afhankelijk van |
|--------|-------------|--------|-----------------|
| F-16a | `PreviewPanel` component + transitie-animaties | ✅ Done | F-03, F-04 |
| F-16b | `PreviewFrame` iframe srcdoc + debounce | ✅ Done | F-16a |
| F-16c | `useWorkspaceLayout` Zustand store + hooks | ✅ Done | F-16a |
| F-16d | SSE event routing `open_split_view` + `preview_update` | 🔲 Open | F-07, B-04 |
| B-16 | Hermes gedragsregel + `preview_update` SSE events | 🔲 Open | B-03, B-04 |

**Backend-vereisten voor live preview (B-16):**

Hermes moet twee SSE event-types ondersteunen via de streaming pipeline (B-04):

1. **`open_split_view`** — Hermes stuurt dit event wanneer het detecteert dat de gebruiker een visueel project wil bouwen (website, app, dashboard). React vangt dit op in `useHermesStream` en roept `setSplitView()` aan.
   ```json
   { "type": "open_split_view" }
   ```

2. **`preview_update`** — Hermes stuurt complete HTML/CSS/JS als één string bij elke significante output-wijziging. React schrijft dit naar `updatePreview(html)` → iframe `srcdoc` wordt bijgewerkt (debounced 400ms).
   ```json
   { "type": "preview_update", "html": "<!DOCTYPE html>..." }
   ```

**Hermes IDENTITY.md bouw-gedrag:**
- Wanneer Hermes een bouw-taak herkent, stuur eerst `open_split_view`
- Bij elke code-generatie stap: stuur `preview_update` met de complete, renderable HTML (niet incrementeel — altijd het volledige document)
- HTML moet self-contained zijn (inline CSS/JS, geen externe imports tenzij CDN)
- Bij afsluiting van de bouw-sessie: geen speciale close-event nodig (gebruiker sluit preview handmatig)

**Implementatievolgorde backend:**
1. B-03 (MCP bridge) moet draaien ← **blokkeert alles**
2. B-04 (SSE pipeline) moet `type`-based event routing ondersteunen (niet alleen tekst-tokens)
3. B-16: Hermes IDENTITY.md aanpassen met bouw-gedragsregels + `preview_update` output format

**Open beslissingen:**

| # | Vraag | Status |
|---|-------|--------|
| 17 | Preview minimale breedte op mobile: stacked of verbergen? | Open |
| 18 | Preview-persistentie: iframe-staat bij chat-scroll of reset bij update? | Open |
| 19 | Preview max-grootte HTML: limiet op `preview_update` payload? | Open |
| 20 | Meerdere bestanden: moet Hermes multi-file projecten bundelen tot één HTML? | Open |

---

### F-17 · ProjectList + ProjectTaskBoard (Building Project Tasks) ✅
**Week:** 3-4 | **Afhankelijk van:** F-03 (WorkspaceSidebar), F-09 (Routing), B-14 | **Blokkeert:** F-18, F-19
**Status:** Afgerond als frontend-stub (8 april 2026)

Building project tasks zijn het vangnet voor alle mogelijke en afgesproken taken per bouwproject. Ze werken fundamenteel anders dan daily tasks: ze zijn project-gebonden, Arcamatrix beheert ze automatisch, en ze zijn altijd zichtbaar met een duidelijke status.

**Wat er gebouwd is:**
- `ProjectsPage` — overzicht van alle bouwprojecten + drie-koloms bord per project (Backlog · In behandeling · Afgerond)
- `TaskCard` — individuele taakkaart met bron-indicator (platform/WhatsApp/Telegram/Arcamatrix)
- Zustand store (`projectStore.ts`) + custom hooks (`useProjects.ts`) — patroon identiek aan bestaande stores
- `services/projectApi.ts` — stub-endpoints (zelfde aanpak als B-01 auth-stub)
- Sidebar uitgebreid met "All Projects" nav-item + per-project "Task Board" link

**Data model:**
```typescript
interface Project {
  id: string; user_id: string; name: string; description?: string;
  created_at: string; last_activity: string;
}

interface ProjectTask {
  id: string; project_id: string; title: string; description?: string;
  status: 'backlog' | 'in_progress' | 'done';
  source: 'platform' | 'whatsapp' | 'telegram' | 'arcamatrix';
  priority?: 'low' | 'medium' | 'high';
  created_at: string; updated_at: string;
  started_at?: string; completed_at?: string;
  arcamatrix_note?: string;
}
```

**Arcamatrix-gedrag (toekomstig, wacht op B-17):**
- Gebruiker stuurt via WhatsApp/Telegram/platform een idee → Arcamatrix voegt het toe als Backlog-taak
- Gebruiker zegt "begin hier direct mee" → Arcamatrix start direct, taak krijgt status `in_progress`
- Status-wijzigingen komen real-time binnen via SSE

**Geen drag-and-drop in MVP** — dit is fase B.

---

### F-18 · TaskDetailPanel ✅
**Week:** 4 | **Afhankelijk van:** F-17
**Status:** Afgerond (8 april 2026)

Sliding side-panel (translateX animatie, 350ms cubic-bezier(0.16, 1, 0.3, 1)) dat opent bij klik op een TaskCard. Toont volledige taak-details, bewerkbare titel/beschrijving, status-switcher, Arcamatrix-notitie (readonly met teal accent border), activiteitslog, en bevestigde verwijder-actie.

---

### F-19 · AddTaskModal ✅
**Week:** 4 | **Afhankelijk van:** F-17
**Status:** Afgerond (8 april 2026)

Eenvoudig modal voor het handmatig aanmaken van een Backlog-taak via het platform. Nieuwe taken beginnen altijd in Backlog. Source wordt automatisch `platform`. Bevat taaknaam, optionele beschrijving, en prioriteit-keuze.

---

### F-20 · Daily Tasks — Automation Dashboard ✅
**Week:** 3 | **Locatie:** Workspace sidebar → Daily Tasks → Tasks
**Status:** Afgerond (8 april 2026) | **NIET IN ORIGINEEL PLAN — achteraf gedocumenteerd**

Automation dashboard dat laat zien hoeveel tijd Arcamatrix bespaart via geautomatiseerde workflows.

**Wat gebouwd is:**
- **Time-saved hero** met toggle per periode (Today / Week / Month)
- **Stats row:** Active automations · Runs today · Time saved
- **6 mock automation cards:**
  1. Email triage & labeling
  2. Weekly report generator
  3. Agenda sync & reminders
  4. Lead intake from LinkedIn
  5. Invoice processing
  6. Social media scheduler
- Per card: status (active/paused/error), trigger-type, run count, time saved
- Expandable detail view per card: beschrijving, last run, metrics

**Afhankelijk van (toekomstig):** B-07 (Hermes gateway) voor echte cron-scheduler data, Hermes skills-systeem voor automation-definities.

**Relatie tot sidebar-structuur:** Het masterplan definieerde "Daily Tasks" als sidebar-sectie met Tasks/Files/Chats sub-items. Dit ticket voegt de daadwerkelijke Tasks-view in met automation-focus.

---

### F-21 · SettingsModal (afwijking van F-15) ✅
**Week:** 3 | **Status:** Afgerond (8 april 2026) | **NIET IN ORIGINEEL PLAN — achteraf gedocumenteerd**

F-15 specificeert een volledige Account-pagina op `/account` met tabs: Profiel, Brain, Billing, API. In plaats daarvan is een **modal** gebouwd met 2 tabs:
- **Account & Billing** — placeholder
- **API** — placeholder

**Afwijkingen t.o.v. F-15:**
- Modal i.p.v. aparte pagina (geen route `/account`)
- Geen Profiel-tab (USER.md)
- Geen Brain-tab (Identity/Soul/Knowledge/Memory)

**Open vraag:** Is de modal de definitieve richting, of wordt F-15 als volledige pagina alsnog gebouwd? Als de modal blijft, moet de Brain-functionaliteit elders landen.

---

### F-22 · Sages — Call-knoppen in InputBar
**Week:** 3 | **Afhankelijk van:** F-04 (SandboxWorkspace / InputBar) | **Blokkeert:** F-23

Voeg twee icon-knoppen toe aan de bestaande `InputBar`: een telefoon-icoon (voice-only) en een video-icoon (video + avatar). Knoppen zijn 34×34px, consistent met de bestaande MorphButton send-state. Hover-state via teal highlight. In sandbox: knoppen zichtbaar maar triggeren na 3 seconden een signup-prompt.

---

### F-23 · Sages — SagesOverlay + CallControls
**Week:** 3-4 | **Afhankelijk van:** F-22, S-01 | **Blokkeert:** F-24, F-25

Volledige overlay die de werkruimte bedekt bij een actief gesprek. Animaties: `opacity + scale` in `350ms cubic-bezier(0.16, 1, 0.3, 1)` bij openen, `250ms ease-in` bij sluiten. Drie zones: avatar/waveform, transcriptie-label, call-controls. Drie call-knoppen (mute, camera, ophangen) met correcte active-states. Escape-toets hangt op. Na ophangen: transcript gepushed naar messageStore als normale chatberichten.

---

### F-24 · Sages — SagesAvatar (video-modus)
**Week:** 4 | **Afhankelijk van:** F-23, S-01

Geanimeerde 2D CSS-avatar (geen 3D/WebGL). Vier states: `idle` (zweefbeweging), `listening` (pulserende ring), `thinking` (roterende gradient-border), `speaking` (amplitude-gedreven schaalanimatie via Web Audio API analyser). Amplitude wordt uitgelezen van de TTS-audiostream. `prefers-reduced-motion`: alle animaties disabled.

---

### F-25 · Sages — SagesWaveform (voice-modus)
**Week:** 4 | **Afhankelijk van:** F-23, S-01

Canvas-gebaseerde audio waveform visualizer. Groen voor microfoon-input, teal voor TTS-output. Geen externe libraries — puur Web Audio API + `requestAnimationFrame`. Schakelaar gebeurt automatisch op basis van wie er spreekt.

---

## Backend Tickets

> **Referentie:** Beslissing #6 — gebruik MCP via `mcp_serve.py`. Start altijd met een minimale ping/tool-call validatie.

---

### B-01 · Auth endpoints ✅
**Week:** 1 | **Status:** Afgerond als frontend-stub (7 april 2026)

```
POST /auth/google           → { access_token, user, workspace_id, is_new_user }
POST /auth/email/start      → { sent: true }
POST /auth/email/verify     → { access_token, user, workspace_id, is_new_user }
```

---

### B-02 · Sandbox provisioning
**Week:** 1-2 | **Blokkeert:** F-04

```
POST /sandbox/create        → { sandbox_id, hermes_session_id, expires_at }
POST /sandbox/heartbeat     → { expires_at }
POST /sandbox/promote       → { workspace_id, access_token }
DELETE /sandbox/{id}        (internal cron — geen user-binding)
```

---

### B-03 · Mastra ↔ Hermes bridge (MCP) 🔴
**Week:** 1 | **Blokkeert:** alles

Kritiek pad. Startpunt: `python mcp_serve.py` in Hermes-repo, valideer met minimale ping/tool-call, commit als `hermes-mcp-spike`.

---

### B-04 · SSE streaming pipeline ◐
**Week:** 1 | **Blokkeert:** F-07 productie | **Status:** Lokale demo live

```
GET /stream/:session_id     (text/event-stream)
  → Hermes token output in real-time
  + { type: 'usage', used: N, limit: M }
```

---

### B-05 · Token teller + rate limiting ◐
**Week:** 2-3 | **Status:** Lokale stub live

```
GET /tokens/status          → { used, limit, resets_at, tier }
Middleware op /agent/*      → 429 + upgrade-prompt bij overschrijding
budget_exhausted SSE event  → zachte upgrade-prompt in UI
```

---

### B-06 · Hermes namespace isolatie
**Week:** 3 | **Afhankelijk van:** B-02

```
/hermes-data/
  sandbox/{sandbox_id}/    ← anonieme bezoekers (TTL 30 min)
  {user_id}/
    IDENTITY.md · SOUL.md · USER.md · MEMORY.md
    skills/ · knowledge/ · sessions/
  connectors/              ← OAuth tokens (encrypted)
```

---

### B-07 · Hermes gateway (WhatsApp + Telegram)
**Week:** 4 | **Afhankelijk van:** B-06 | **Beslissing #10 vereist**

Ingebouwde Hermes gateway (`hermes gateway start`). Koppelt workspace-sessies aan messaging platforms.

---

### B-08 · GDPR + EU data residency
**Week:** 4 | **Afhankelijk van:** B-06

- EU servers voor alle user data
- `DELETE /account` verwijdert Hermes workspace volledig
- Sandbox-data weg na TTL als niet gepromoveerd

---

### B-09 · Connectors OAuth (Mastra)
**Week:** 3-4 | **Blokkeert:** F-11

```
POST /connectors/oauth/start        → { auth_url }
POST /connectors/oauth/callback     → { connected, provider, scopes }
GET  /connectors/status             → { connected: [...] }
DELETE /connectors/{provider}       → revoke + verwijder tokens
```

---

### B-10 · Skills API (Mastra)
**Week:** 3-4 | **Blokkeert:** F-12

```
GET    /skills/browse               → { skills: [...] }
POST   /skills/install              → { installed, skill_id }
GET    /skills/installed            → { skills: [...] }
PATCH  /skills/{id}                 → toggle activatie
DELETE /skills/{id}                 → verwijderen
```

---

### B-11 · Brain Knowledge API (Mastra)
**Week:** 3-4 | **Blokkeert:** F-15 Brain-tab

```
GET/PUT  /brain/knowledge/identity  → IDENTITY.md + SOUL.md
GET/POST /brain/knowledge/files     → upload, index, verwijder knowledge files
```

---

### B-12 · Brain Memory API (Mastra)
**Week:** 3-4 | **Blokkeert:** F-15 Brain-tab

```
GET    /brain/memory                → items lijst
POST   /brain/memory                → item toevoegen
PATCH  /brain/memory/{id}           → item bewerken
DELETE /brain/memory/{id}           → item verwijderen
```

---

### B-13 · Secrets API (Mastra)
**Week:** 3 | **Blokkeert:** F-13
**NIEUW — stond niet in origineel masterplan**

```
GET    /secrets                     → { secrets: [{ name, created_at }] }
POST   /secrets                     → { name, value } → encrypted opslag
DELETE /secrets/{name}              → verwijderen
```

Secrets zijn encrypted opgeslagen per user in Mastra. Waarden zijn na opslaan niet meer leesbaar in de UI (alleen naam zichtbaar).

---

### B-14 · Projects API (Mastra)
**Week:** 3-4 | **Blokkeert:** F-14
**NIEUW — stond niet in origineel masterplan**

```
GET    /projects                    → { projects: [...] }
POST   /projects                    → { name } → { project_id }
PATCH  /projects/{id}               → hernoemen
DELETE /projects/{id}               → verwijderen + Hermes namespace cleanup
```

Per project eigen Hermes namespace: `/hermes-data/{user_id}/projects/{project_id}/`.

---

### B-17 · Project Tasks API + SSE events (Mastra)
**Week:** 3-4 | **Afhankelijk van:** B-01, B-04, B-14 | **Blokkeert:** F-17 (real-time)
**NIEUW — building project tasks backend**

```
GET  /projects/:id/tasks              → { tasks: ProjectTask[] }
POST /projects/:id/tasks              → { task: ProjectTask }
  body: { title, description?, priority?, source, status: 'backlog' }

PATCH /projects/:id/tasks/:taskId     → { task: ProjectTask }
  body: { status?, title?, description?, arcamatrix_note? }

DELETE /projects/:id/tasks/:taskId    → { deleted: true }
```

**SSE uitbreiding (B-04):**
Wanneer Arcamatrix via Hermes een taak aanmaakt of bijwerkt (vanuit WhatsApp, Telegram of autonoom), emits Mastra een SSE-event:
```
event: project_update
data: { type: 'task_created' | 'task_updated' | 'task_deleted', task: ProjectTask }
```

**Hermes-integratie (via MCP, B-03):**
- `project_task_create(project_id, title, description, priority)` — taak aanmaken
- `project_task_update_status(task_id, status, arcamatrix_note)` — status updaten
- `project_task_list(project_id)` — taken ophalen voor context

**Opslag:** in Mastra DB (PostgreSQL of SQLite), niet in Hermes namespace-files — taken zijn gestructureerde data, geen vrije-tekst memory.

---

## Service Tickets

### S-01 · Sages — Web Speech API + TTS pipeline (Mastra)
**Week:** 3-4 | **Afhankelijk van:** B-03 (Hermes MCP bridge) | **Blokkeert:** F-23, F-24, F-25

```
POST /sages/session/start
  body: { mode: 'voice' | 'video', workspace_id }
  → { session_id, tts_voice }

POST /sages/speak
  body: { session_id, transcript }
  → Mastra stuurt transcript naar Hermes (via bestaande MCP)
  → Hermes genereert tekstresponse
  → Mastra stuurt tekst naar OpenAI TTS API
  → { response_text, response_audio_url }

POST /sages/tts
  body: { text, voice }
  → Proxied naar OpenAI TTS API
  → audio/mpeg stream terug naar client

POST /sages/session/end
  body: { session_id }
  → { duration_seconds, transcript: SagesMessage[] }
```

**STT:** Client-side via Web Speech API (geen server-side STT nodig in MVP — browser doet het zelf). Fallback-label in UI wanneer Web Speech API niet beschikbaar is.

**TTS-stem:** Sla de gekozen stem op in `USER.md` als voorkeur. Default: `nova` (OpenAI TTS).

**Token-verbruik:** Sages-gesprekken verbruiken tokens via de bestaande B-05 token-counter. Een typisch 2-minuten gesprek ≈ 500-1000 tokens. Tokens worden per beurtwisseling opgeteld, niet per seconde.

**Beslissing vereist:** Welke TTS-provider voor Sages? (Beslissing #21)

---

### Sages — Data model

```typescript
interface SagesSession {
  id: string;
  workspace_id: string;
  mode: 'voice' | 'video';
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  tts_voice: string;
  transcript: SagesMessage[];
}

interface SagesMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
```

Sages-sessies worden als afzonderlijke records opgeslagen in de Mastra DB (naast de normale chat-sessies). Na afloop wordt de transcript gespiegeld in de reguliere chatgeschiedenis.

### Sages — Architectuur

```
React (SagesOverlay)
  │
  ├── Web Speech API (STT)          ← client-side, geen server
  │     └── transcript → POST /sages/speak
  │
  ├── POST /sages/speak
  │     └── Mastra → Hermes (via MCP, B-03)
  │           └── response text → Mastra
  │
  └── POST /sages/tts
        └── Mastra → OpenAI TTS API
              └── audio/mpeg stream → Web Audio API analyser
                    ├── SagesAvatar amplitude-animatie
                    └── SagesWaveform visualisatie
```

---

## Uitvoeringsplanning

```
Week 1  — Fundament + live sandbox (kritieke path)
  ├── F-01  LandingPage layout                     ✅
  ├── F-02  SignupPanel (statisch)                  ✅
  ├── F-04  SandboxWorkspace shell (skeleton)
  ├── F-05  ChatMessage componenten                 ✅
  ├── F-06  MorphButton component                   ✅
  ├── F-07  SSE streaming consumer hook             ✅ (mock)
  ├── B-01  Auth endpoints                          ✅ (stub)
  ├── B-02  Sandbox provisioning                    ← blokkeert F-04
  ├── B-03  Mastra ↔ Hermes bridge (MCP)            🔴 kritiek pad
  └── B-04  SSE streaming pipeline                  ◐ (lokale demo live)

Week 2  — Integratie + streaming
  ├── F-04  SandboxWorkspace live (SSE inplugged)
  ├── F-04  BudgetBar component
  ├── B-04  SSE streaming pipeline productie
  └── B-05  Token teller (sandbox + gratis tier)    ◐ (stub live)

Week 3  — Sidebar + nieuwe features + split view + Sages start
  ├── F-03  WorkspaceSidebar (+ Projects nav-item)   ← UPDATED
  ├── F-09  Routing (+ /projects/:id route)          ← UPDATED
  ├── F-13  Secrets UI                              NIEUW
  ├── F-14  Projects UI                             NIEUW
  ├── F-16  Visual Split View ("Bouw modus")        NIEUW
  ├── F-17  ProjectList + ProjectTaskBoard (start)  ✅ NIEUW
  ├── F-20  Daily Tasks Automation Dashboard        ✅ ACHTERAF GEDOCUMENTEERD
  ├── F-21  SettingsModal                           ✅ ACHTERAF GEDOCUMENTEERD (afwijking F-15)
  ├── F-11b Integrations Backend-sectie             ✅ ACHTERAF GEDOCUMENTEERD
  ├── F-22  Sages call-knoppen in InputBar          ← NIEUW (Sages)
  ├── F-23  SagesOverlay + CallControls (start)     ← NIEUW (Sages)
  ├── F-04  Volledige transitie-animaties
  ├── B-06  Hermes namespace isolatie
  ├── B-13  Secrets API                             NIEUW
  ├── B-14  Projects API                            NIEUW
  ├── B-16  Hermes bouw-gedrag + preview SSE        NIEUW
  ├── B-17  Project Tasks API stub + SSE (start)    NIEUW
  └── S-01  Sages TTS pipeline + stub-endpoints     ← NIEUW (Sages)

Week 4  — Account-pagina, Brain, Sages afwerking, QA
  ├── F-10  Mobile layout (incl. ProjectTaskBoard tabs + Sages mobile) ← UPDATED
  ├── F-11  Tools → Integrations (connector cards)
  ├── F-12  Tools → Skills (browse + install)
  ├── F-15  Account-pagina (Profiel / Brain / Billing / API)
  ├── F-17  ProjectTaskBoard (afronding + real-time SSE) ✅
  ├── F-18  TaskDetailPanel                         ✅ NIEUW
  ├── F-19  AddTaskModal                            ✅ NIEUW
  ├── F-23  SagesOverlay (afronding)                ← NIEUW (Sages)
  ├── F-24  SagesAvatar (video-modus)               ← NIEUW (Sages)
  ├── F-25  SagesWaveform (voice-modus)             ← NIEUW (Sages)
  ├── S-01  Sages TTS productie-koppeling           ← NIEUW (Sages)
  ├── B-07  Hermes gateway (WhatsApp/Telegram)
  ├── B-08  GDPR checks
  ├── B-09  Connectors OAuth API
  ├── B-10  Skills API
  ├── B-11  Brain Knowledge API
  ├── B-12  Brain Memory API
  ├── B-17  Project Tasks API productie-koppeling   NIEUW
  └── QA    End-to-end: landing → sandbox → signup → workspace → account
            + WhatsApp bericht → task aangemaakt → zichtbaar in board
            + voice call → transcript in chat → tokens verbruikt
```

---

## Brain-modules — Fasering

| Fase | Module | Deliverable | Prio |
|------|--------|-------------|------|
| **MVP** | Account → Brain → Identity + Soul | IDENTITY.md / SOUL.md bewerken | Hoog |
| **MVP** | Account → Brain → User-profiel | USER.md form | Hoog |
| **MVP** | Account → Brain → Memory | Items tonen, toevoegen, verwijderen | Hoog |
| **MVP** | Account → Brain → Knowledge Files | Upload + lijst | Hoog |
| **MVP** | Tools → Skills browse + installeren | Skills-registry + install-flow | Hoog |
| **MVP** | Tools → Integrations read-only OAuth | Google Calendar, Gmail, GitHub | Hoog |
| **MVP** | Secrets | Encrypted key/value store | Hoog |
| **MVP** | Projects | Project CRUD + per-project Tasks/Files/Chats | Hoog |
| **MVP** | Building Project Tasks | Kanban board (Backlog/In behandeling/Afgerond) per project + real-time SSE | Hoog |
| **Fase B** | Memory auto-extractie | Post-sessie memory-suggesties | Middel |
| **Fase B** | Knowledge Files upload + index | PDF/DOCX + embedding | Middel |
| **Fase B** | Connectors write-scope | Gmail sturen, Sheets schrijven | Middel |
| **Fase B** | Soul-elementen | Toon/empathie/proactiviteit sliders | Middel |
| **Fase C** | Custom skills | Markdown-editor + skill-creator | Later |
| **Fase C** | Memory categorieën + zoeken | Tijdlijn, organisatie | Later |
| **Fase C** | Custom connectors | OpenAPI spec upload | Later |
| **Fase D** | Skills marketplace | Publiceren + ratings | Roadmap |
| **Fase D** | Memory-search + tijdlijn | Export, transparantie | Roadmap |

---

## Technische Architectuur — API Overzicht

```
React (UI)
  │
  ├── Sandbox lifecycle
  │   ├── POST /sandbox/create
  │   ├── POST /sandbox/heartbeat
  │   └── POST /sandbox/promote
  ├── Auth
  │   ├── POST /auth/google
  │   └── POST /auth/email/start|verify
  ├── Streaming
  │   └── GET /stream/:session_id        (SSE)
  ├── Tools → Integrations
  │   ├── POST /connectors/oauth/start|callback
  │   ├── GET  /connectors/status
  │   └── DELETE /connectors/{provider}
  ├── Tools → Skills
  │   ├── GET    /skills/browse
  │   ├── POST   /skills/install
  │   ├── GET    /skills/installed
  │   ├── PATCH  /skills/{id}
  │   └── DELETE /skills/{id}
  ├── Secrets (NIEUW)
  │   ├── GET    /secrets
  │   ├── POST   /secrets
  │   └── DELETE /secrets/{name}
  ├── Projects (NIEUW)
  │   ├── GET    /projects
  │   ├── POST   /projects
  │   ├── PATCH  /projects/{id}
  │   └── DELETE /projects/{id}
  └── Account → Brain
      ├── GET/PUT  /brain/knowledge/identity
      ├── GET/POST /brain/knowledge/files
      ├── GET      /brain/memory
      ├── POST     /brain/memory
      ├── PATCH    /brain/memory/{id}
      └── DELETE   /brain/memory/{id}

Mastra (TypeScript API-laag)
  │  auth · sandbox lifecycle · token budgetten
  │  encrypted secrets + connector-tokens per user
  │  schrijft/leest Hermes workspace files
  │
Hermes (Python — gedeeld proces, namespace-isolatie)
  /hermes-data/
    sandbox/{sandbox_id}/          ← anoniem (TTL 30 min)
    {user_id}/
      IDENTITY.md · SOUL.md · USER.md · MEMORY.md
      skills/ · knowledge/ · sessions/
    projects/{project_id}/         ← per-project namespace (NIEUW)
```

---

## Prioriteitsvolgorde openstaande beslissingen

| Prio | # | Beslissing | Blokkeert |
|------|---|------------|-----------|
| Nu | 2 | Welk openingsbericht toont de sandbox? | Eerste indruk product |
| Week 1 | 9 | LLM provider (OpenRouter/OpenAI/Anthropic)? | Kosten per pageview |
| Week 1 | 1 | Magic link of wachtwoord? | B-01 |
| Week 3 | 4 | Hosting EU (Fly.io, Railway, eigen)? | B-06, B-08 |
| Week 3 | 10 | Hermes gateway: ingebouwd of eigen? | B-07 scope |
| Week 3 | 13 | Knowledge embeddings: FAISS of Pinecone? | Brain Knowledge |
| Week 3 | 14 | Memory-extractie: automatisch of opt-in? | Brain Memory |
| Week 3 | B4 | Connector-tokens: Mastra DB of Hermes workspace? | Security |
| Later | 5 | Analytics (Posthog/Mixpanel/geen)? | Privacy scope |
| Later | 15 | Skills-registry: eigen of community? | Brain Skills |
| Later | 16 | Sandbox promote-flow UI? | F-04 promote state |
| Later | B5 | Custom skills: public of private-first? | Marketplace |
| Week 3 | 21 | TTS-provider voor Sages? | S-01 scope |
| Week 3 | 22 | Stem-keuze: vast of instelbaar? | User experience |
| Later | 23 | Gesprekstranscriptie: zichtbaar of opt-in? | UX |

---

## Handoff voor Claude (frontend)

Start met F-01 → F-02 → F-05 → F-06 → F-07 → F-04 (shell). Bouwbaar zonder backend via mock/stub.

Sidebar-referentie: `arcamatrix-sidebar.html` (8 april 2026). Brain leeft op Account-pagina — **niet** in de sidebar.
Timing-referentie: `arcamatrix-v2.html`. Gebruik waarden letterlijk.
State: altijd via custom hooks, nooit direct `useStore()` in componenten.

## Handoff voor Codex (backend)

Start met B-02 en B-01 parallel. Kritiek pad: **B-03** (MCP bridge). Zodra B-03 draait, kunnen B-04, B-09 t/m B-14 in parallel lopen.

Nieuwe tickets t.o.v. origineel: B-13 (Secrets API) en B-14 (Projects API).
