# Arcamatrix — Phase 1 Development Plan
**Landing page · Free account onboarding · Brain modules · Visitor Sandbox**
*Stack: React · Mastra (TypeScript) · Hermes Agent (Python) | Bijgewerkt: 7 april 2026*

---

## Doel van Phase 1

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

**Hermes** (30k stars, v0.7.0, MIT) is de daadwerkelijke agent-engine: 40+ tools, zelfverbeterend skills-systeem, persistent memory per gebruiker, ingebouwde cron-scheduler, en een gateway voor Telegram/WhatsApp/Discord. Het is 93% Python en draait als zelfstandige service.

**Mastra** is de TypeScript-brug: beheert auth, user-sessions, sandbox lifecycle, API-endpoints, en orkestreert wanneer Hermes wordt aangeroepen.

---

## Architectuur per laag

### React (Frontend)

Verantwoordelijk voor:
- Landing page + signup flow (geanimeerde split-screen ervaring)
- Workspace UI shell (sidebar, chat interface, Brain-modules)
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
        → Rename namespace: /hermes-data/sandbox/{sandbox_id}/ → /hermes-data/{user_id}/
        → cookie vervangen door permanente auth-token
        → return: { workspace_id: sandbox_id, promoted: true }

        Geen data gekopieerd of verloren — de workspace wás al de demo.
```

### Mastra Sandbox-endpoints

```typescript
POST /sandbox/create
  → { sandbox_id, hermes_session_id, expires_at, token_budget: 5000 }

POST /sandbox/heartbeat
  body: { sandbox_id }
  → { expires_at }  // +15 min bij activiteit

POST /sandbox/promote
  body: { sandbox_id, id_token | email_token }
  // Promote = rebind, geen kopie
  1. Valideer auth token → user_id ophalen
  2. DB: schrijf sandbox_id → user_id binding
  3. Verwijder TTL timer
  4. Rename namespace: /sandbox/{id}/ → /{user_id}/
  5. Vervang cookie door permanente access_token
  → { user_id, workspace_id: sandbox_id, access_token }
  // Frontend: zelfde state, geen reload, geen lege workspace

DELETE /sandbox/{sandbox_id}  // internal cron — alleen sandboxes ZONDER user-binding
  → Hermes namespace verwijderen
```

### Token-budgetten

| Tier | Budget | Reset |
|------|--------|-------|
| Sandbox (anoniem) | 5.000 tokens | eenmalig per sandbox |
| Gratis account | 25.000 tokens | per dag (reset 00:00 UTC) |
| Premium | onbeperkt | — |

Bij budget bereikt → zachte prompt: *"Je hebt het gratis proefkrediet gebruikt — maak een account aan voor 25K tokens/dag."*

### Hermes Isolatie-model

Gekozen model: **optie B — gedeeld proces, geïsoleerde namespaces** (licht, snel, geen koude opstart per bezoeker).

```
Hermes daemon (gedeeld)
  ├── namespace: sandbox/abc-123/   ← bezoeker 1
  ├── namespace: sandbox/def-456/   ← bezoeker 2
  ├── namespace: user/user-789/     ← ingelogde user
  └── namespace: user/user-012/     ← ingelogde user
```

Elke namespace heeft eigen `MEMORY.md`, `USER.md`, `sessions/`, `skills/`. Bij promote: namespace rename + nieuwe auth-binding.

### GDPR

Sandboxes slaan geen persoonsgegevens op (anoniem). Bij promote: expliciete toestemming op signup-moment. Sandbox-data zonder promote (= geen user-binding) verdwijnt automatisch na TTL — geen data-retentie issue. Gepromoveerde workspaces vallen onder het normale gebruikersbeleid. Clean onder AVG.

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
| 8b | Demo cut-off: wanneer stopt de live sessie? | ✅ Besloten | **Optie 3 — Scenario-driven** (+ max-berichten als fallback) |
| 9 | LLM provider voor Hermes: OpenRouter, OpenAI of Anthropic? | 🔲 Open | — |
| 10 | Hermes gateway: ingebouwd of eigen WhatsApp/Telegram integratie? | 🔲 Open | — |
| 11 | Build tool: Vite of CRA? | ✅ Besloten | **Vite** |
| 12 | State management: Zustand, Context API of iets anders? | ✅ Besloten | **Zustand** (zie migratie-noot) |
| 13 | Knowledge embeddings: lokaal (FAISS) of hosted (Pinecone)? | 🔲 Open | — |
| 14 | Memory-extractie: automatisch na sessie of opt-in? | 🔲 Open | — |
| 15 | Skills-registry: eigen hosted of Hermes community? | 🔲 Open | — |
| 16 | Sandbox promote-flow UI: modal, inline of aparte pagina? | 🔲 Open | — |

---

### Beslissing #8 — Live Sandbox ✅

De landing page draait op een echte Hermes-instantie via het sandbox-model. De bezoeker krijgt meteen een werkende workspace — zonder account, zonder pre-script.

**Implicaties voor de planning:**
- B-02 (sandbox provisioning) en B-03 (MCP bridge) moeten operationeel zijn vóór F-04 live content kan tonen
- F-07 (SSE consumer) schuift op naar week 1 zodat parallel geïntegreerd kan worden zodra B-04 klaar is
- F-08 (demoConfig.ts / demoScript.ts) **vervalt volledig** — er is geen pre-scripted demo meer
- Elke pageview kost LLM-tokens — beslissing #9 (provider) wordt daardoor urgenter

---

### Beslissing #8b — Scenario-driven cut-off ✅

Hermes voert een specifiek demo-scenario uit (beslissing #2) en triggert de MorphButton zodra het scenario compleet is — niet op basis van tijd of een berichtenteller.

**Implementatie:**
- Hermes geeft een speciaal `demo_complete` signaal terug als het scenario klaar is
- Mastra propageert dit signaal via de SSE-stream als een event-type: `event: demo_complete`
- De `useHermesStream` hook vangt dit op en roept `onDemoComplete()` aan
- MorphButton morph-animatie start (`900ms cubic-bezier(0.16, 1, 0.3, 1)`)

**Fallback:** Als het scenario om welke reden dan ook niet voltooid wordt (timeout, LLM-fout), triggert een max-berichten veiligheidsnet. Instelbaar via `demoConfig.ts`:

```typescript
export const DEMO_CONFIG = {
  initialPrompt: string;              // beslissing #2
  cutOffTrigger: 'scenario',          // ✅ besloten
  maxMessagesFallback: 6,             // veiligheidsnet
  morphTriggerDelay: 1400,            // ms na laatste bericht
};
```

> **Volgende stap:** Beslissing #2 (welk scenario / openingsbericht) is nu de enige blokkade voor de demo-flow. Zodra het scenario bekend is, kan de sandbox-ervaring volledig afgerond worden.

---

### Beslissing #12 — Zustand ✅ (met migratie-noot)

**Ja, je kunt later makkelijk overstappen naar Context API** — mits je Zustand vanaf dag 1 achter custom hooks plaatst:

```typescript
// Zo NIET: direct Zustand gebruiken in componenten
const phase = useStore(s => s.demoPhase);

// Zo WEL: altijd via een custom hook
export const useDemoPhase = () => useStore(s => s.demoPhase);
export const useAuthStatus = () => useStore(s => s.authStatus);
```

Als alle componenten via `useDemoPhase()` en `useAuthStatus()` praten in plaats van direct `useStore()`, is de onderliggende implementatie (Zustand, Context, Jotai) vervangbaar zonder één component aan te raken — alleen de hook-internals wijzigen.

**Dit patroon moet vanaf F-01 toegepast worden.** Dit is geen overhead; het is hoe goed onderhoudbare React eruitziet ongeacht welke state-library je kiest.

---

## Frontend Tickets

> **Referentie voor alle frontend-tickets:** Gebruik `arcamatrix-v2.html` als visuele en timing-referentie. Gebruik deze waarden direct — niet interpreteren, niet aanpassen:
>
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
> **Build tool:** Vite
> **State management:** Zustand, altijd via custom hooks (zie beslissing #12)

---

### F-01 · LandingPage component ✅
**Week:** 1 | **Blokkeert:** F-02, F-04 | **Status:** Afgerond (7 april 2026)

Split-screen layout, volledig responsive.

```
Route: / (redirect → /workspace als al ingelogd of sandbox actief)

<LandingLayout>
  <SignupPanel />         ← links, sticky, 420px
  <SandboxWorkspace />    ← rechts, live Hermes sandbox
</LandingLayout>
```

**Referentie:** `arcamatrix-v2.html` — let op de exacte breedte van het linkerpanel (420px) en het moment waarop de split plaatsvindt bij resize.

---

### F-02 · SignupPanel component ✅
**Week:** 1 | **Afhankelijk van:** F-01 | **Status:** Afgerond (7 april 2026)

```
States: default → transitioning → workspace
Props: onSignup(method, email?) → void

Elementen:
  - Logo + headline
  - Google OAuth button
  - Email input + "Start Free →"
  - Trust badges: Free forever · 25K tokens/day · GDPR · EU
```

CSS-transitie: signup (420px) → sidebar (220px) over `750ms cubic-bezier(0.16, 1, 0.3, 1)`

**Referentie:** `arcamatrix-v2.html` — de breedte-transitie is de kern van de UX. Animeer exact zoals de prototype.

---

### F-03 · WorkspaceSidebar component
**Week:** 3 | **Afhankelijk van:** F-01, F-09

Hergebruik van de bestaande sidebar uit de app.
- Nav: Chat · Brain (Tools, Knowledge, Memory) · Tasks · Files · Settings
- Channels: WhatsApp · Telegram
- Footer: Leave feedback

**Referentie:** Bestaande sidebar-code uit de app. Enige aanpassing: fade-in animatie (`450ms ease, delay 400ms` vanuit `arcamatrix-v2.html`).

---

### F-04 · SandboxWorkspace component
**Week:** 1 (shell) + week 2 (live integratie) + week 3 (transitie-animaties) | **Afhankelijk van:** F-01, B-02, B-04

```
States: loading → active → budget_warning → promote_prompt → workspace

Sub-componenten:
  <WorkspaceWindow />   ← macOS-stijl venster
  <ChatArea />          ← scrollbare berichten (live Hermes via sandbox)
  <InputBar />          ← inputveld + MorphButton
  <BudgetBar />         ← subtiele token-indicator

Input gedrag:
  - Input is direct actief bij page load (sandbox is live)
  - Submit handler: sendToSandbox(sandbox_id, text) via SSE
  - Disabled state: alleen bij token-budget bereikt
  - "Sign up for free →" knop blijft zichtbaar naast de input,
    maar blokkeert het typen NIET
```

Venster-transitie naar workspace bij signup: `border-radius 0, border none, box-shadow none` over `750ms cubic-bezier(0.16, 1, 0.3, 1)`

**Week 1:** Bouw de volledige UI-shell inclusief alle states. SandboxWorkspace toont een skeleton/loading state zolang B-02/B-04 nog niet live zijn.

**Week 2:** SSE stream inpluggen zodra B-04 beschikbaar is.

**Week 3:** Volledige transitie-animaties (sandbox → workspace bij signup).

**Verschil t.o.v. origineel plan**: geen pre-scripted demo-animatie meer. De sandbox draait live Hermes — F-08 (demoScript.ts) vervalt volledig.

**MorphButton trigger:** Na eerste Hermes-response (niet na laatste demo-bericht — er is geen demo-script meer).

**Referentie:** `arcamatrix-v2.html` — macOS-venster styling, schaduw, border-radius en workspace-transitie zijn exact gedefinieerd.

---

### F-05 · ChatMessage componenten ✅
**Week:** 1-2 | **Afhankelijk van:** F-04 | **Status:** Afgerond (7 april 2026)

```typescript
type MessageType =
  | { type: 'user'; text: string }
  | { type: 'ai-status'; text: string }       // pulserende groene dot
  | { type: 'ai-pills'; items: string[] }      // actie-pills
  | { type: 'ai-brief'; content: Chunk[] }     // typewriter
  | { type: 'ai-text'; text: string }
  | { type: 'budget-warning'; used: number; limit: number }  // nieuw — sandbox budget
```

Alle berichten: `opacity 0→1` + `translateY(6px→0)` over `380ms ease`

**Referentie:** `arcamatrix-v2.html` — alle berichttypes zijn visueel gedemonstreerd. Let op de pulserende groene dot bij `ai-status` en de pill-styling bij `ai-pills`.

---

### F-06 · MorphButton component ✅
**Week:** 1-2 | **Afhankelijk van:** F-04, F-05 | **Status:** Afgerond (7 april 2026)

```
States: send (34×34px) → morphing → cta (196px breed) → reset
Tekst: "Sign up for free →"
Timing: width 900ms cubic-bezier(0.16, 1, 0.3, 1)
        tekst 350ms ease, delay 500ms

Trigger-volgorde:
  1. Pagina laadt → input actief, MorphButton is gewone send-knop
  2. Gebruiker stuurt eerste bericht → Hermes antwoordt
  3. Na eerste Hermes-response → MorphButton morpht naar
     "Sign up for free →" (900ms cubic-bezier)
  4. Gebruiker kan daarna blijven typen óf signen
  Oude trigger (na laatste demo-bericht) vervalt — er is geen demo-script meer.
```

Getriggerd door `onFirstResponse()` callback in `useHermesStream` — de morph start 1400ms nadat de eerste AI-response binnenkomt. Niet meer afhankelijk van `demo_complete`. Dit werkt zowel met de mock-stream als met live Hermes (B-04).

**Referentie:** `arcamatrix-v2.html` — gebruik exact de timing. Geen afwijkingen.

---

### F-07 · SSE streaming consumer ✅
**Week:** 1 | **Afhankelijk van:** B-04 | **Status:** Afgerond (7 april 2026)

Mastra stuurt Hermes-output via Server-Sent Events. React consumeert de stream en voedt de typewriter-animatie karakter voor karakter.

```typescript
// Altijd via custom hook — niet direct useStore aanroepen in componenten
export const useSandboxStream = (sandbox_id: string) => {
  // intern: Zustand store + EventSource
  return {
    messages: Message[];
    status: 'idle' | 'streaming' | 'done' | 'error';
    tokenUsage: { used: number; limit: number };
  };
};
```

**Opmerking:** F-07 is naar week 1 geschoven omdat live sandbox direct nodig is. Bouw de hook parallel met B-04 — ze integreren zodra beide klaar zijn.

**Update 7 april 2026:** Hook is opgeleverd met mock/stub die een demo-scenario simuleert tot B-04 live is. Nieuwe bestanden:
- `stores/streamStore.ts` — Zustand store voor stream status, sessionId, demoComplete flag
- `hooks/useHermesStream.ts` — de hook zelf; `USE_LIVE_STREAM` flag switcht naar echte EventSource zodra B-04 draait
- `hooks/useStream.ts` — selector hooks (useStreamStatus, useIsDemoComplete, etc.)
- `services/hermesMock.ts` — mock event-sequence die berichten met delays afvuurt + `demo_complete` event
- `DemoWorkspace.tsx` is geüpdatet: gebruikt nu `useHermesStream` i.p.v. losse `useMessages`, en triggert `setMorphState('morphing')` automatisch na eerste AI-response + 1400ms delay via `onFirstResponse` callback (F-06 update).

---

### ~~F-08 · Demo trigger configuratie~~ — VERVALLEN
**Reden:** Met het sandbox-model is er geen pre-scripted demo meer. De sandbox draait live Hermes. De MorphButton triggert na eerste Hermes-response i.p.v. na een demo-script.

---

### F-09 · Routing
**Week:** 3 | **Afhankelijk van:** F-01, F-03, B-01

```
/           → LandingPage (sandbox aanmaken als geen cookie)
/workspace  → WorkspaceApp (sandbox of auth vereist)
```

React Router v6. Na signup: `router.push('/workspace')` na transitie-animatie.

---

### F-10 · Mobile layout
**Week:** 4 | **Afhankelijk van:** F-01 t/m F-09

Breakpoint < 800px: stacked (form bovenaan, sandbox eronder).
MorphButton scrollt in beeld na eerste Hermes-response.

---

## Backend Tickets

> **Referentie voor alle backend-tickets:** Beslissing #6 is genomen — gebruik **MCP via `mcp_serve.py`** als integratiemethode tussen Mastra en Hermes. Start bij de `mcp_serve.py` in de Hermes-repo en valideer de verbinding met een minimale ping/tool-call vóór je verder bouwt.

---

### B-01 · Auth endpoints (Mastra/Node)
**Week:** 1 | **Blokkeert:** B-02, F-09 | **Status:** Afgerond als frontend-stub (7 april 2026)

```
POST /auth/google
  body: { id_token }
  → Google JWT validatie
  → upsert user
  → return: { access_token, user, workspace_id, is_new_user }

POST /auth/email/start
  body: { email }
  → magic link versturen
  → return: { sent: true }

POST /auth/email/verify
  body: { token }
  → return: { access_token, user, workspace_id, is_new_user }
```

**Opmerking:** Beslissing #1 (magic link vs. wachtwoord) is nog open. Implementeer magic link als default.

**Update 7 april 2026:** In deze workspace ontbreekt nog een Mastra/Node backend, dus `B-01` is hier opgeleverd als een concrete frontend-stub met dezelfde contracten voor `POST /auth/google`, `POST /auth/email/start` en `POST /auth/email/verify`. De signup-flow gebruikt nu magic link als default, toont een lokale demo-token voor verificatie, en levert na succesvolle auth een sessie-object op met `{ access_token, user, workspace_id, is_new_user }` zodat F-09 en verdere integratie tegen een stabiel auth-contract kunnen bouwen.

---

### B-02 · Sandbox provisioning (NIEUW — was workspace provisioning na auth)
**Week:** 1-2 | **Afhankelijk van:** B-01, B-03 | **Blokkeert:** F-04

```
POST /sandbox/create
  (geen auth vereist)
  → Hermes namespace aanmaken: /hermes-data/sandbox/{uuid}/
  → seed default IDENTITY.md + USER.md (leeg)
  → cookie zetten met sandbox_id
  → return: { sandbox_id, hermes_session_id, expires_at }

POST /sandbox/heartbeat
  body: { sandbox_id }
  → TTL verlengen +15 min
  → return: { expires_at }

POST /sandbox/promote
  (auth vereist — promote = rebind, geen kopie)
  body: { sandbox_id }
  1. Valideer auth → user_id ophalen
  2. DB: sandbox_id → user_id binding schrijven
  3. TTL timer verwijderen (workspace wordt permanent)
  4. Namespace lazy rename: /sandbox/{id}/ → /{user_id}/
  5. Cookie vervangen door permanente access_token
  → return: { workspace_id: sandbox_id }

DELETE /sandbox/{sandbox_id}  (internal cron — alleen sandboxes ZONDER user-binding)
  → namespace verwijderen
```

**Kritiek**: na promote is er niets gekopieerd of verloren. De sandbox-conversatie, memory en instellingen die de bezoeker opbouwde zijn direct de permanente workspace. Gebruiker ziet na signup exact dezelfde chat — geen lege state.

---

### B-03 · Mastra ↔ Hermes bridge (MCP)
**Week:** 1 | **Blokkeert:** B-02, B-04, F-04, F-07

**Status:** `In uitvoering` - lokale MCP spike staat klaar en is mock-gevalideerd; echte Hermes-validatie is nog geblokkeerd.

**Update 7 april 2026:** Toegevoegd in de bestaande Arcamatrix codebase: een minimale stdio MCP client, een runnable `hermes-mcp-spike` script en een mock-integratietest voor `initialize -> tools/list -> tools/call`. De echte stap `python mcp_serve.py` + minimale ping/tool-call naar Hermes kon in deze workspace nog niet afgerond worden omdat er geen lokale Hermes checkout met `mcp_serve.py` aanwezig is en de huidige Arcamatrix kopie geen git-metadata bevat voor de gevraagde commit `hermes-mcp-spike`.

**Beslissing #6 genomen: gebruik MCP via `mcp_serve.py`.**

```bash
# Startpunt in Hermes-repo:
python mcp_serve.py

# Mastra-side: MCP client initialiseren
# Stap 1: minimale ping/tool-call valideren → commit als 'hermes-mcp-spike'
# Stap 2: wrapper bouwen voor session management
# Stap 3: integratietest schrijven: Mastra → MCP → Hermes → response
```

**Prioriteit:** Dit ticket blokkeert nu ook de frontend (F-04, F-07) omdat live sandbox vereist is. B-03 is de harde kritieke path voor week 1.

**Referentie:** `mcp_serve.py` in de Hermes-repo. Bekijk de Hermes-documentatie voor welke tools via MCP exposed worden.

---

### B-04 · SSE streaming pipeline
**Week:** 1 | **Afhankelijk van:** B-03 | **Blokkeert:** F-07

**Status:** `Gedeeltelijk afgerond` - lokale Hermes -> Mastra -> React SSE demo draait nu end-to-end in deze workspace, inclusief live `usage` events voor de BudgetBar; de echte Hermes productie-koppeling blijft afhankelijk van B-03.

**Update 7 april 2026:** Toegevoegd in deze workspace: een lokale `/api/demo/session` bootstrap, een Vite-based SSE endpoint op `GET /api/stream/:session_id`, een echte `useHermesStream` consumer op `EventSource`, incrementele `token` events en `usage` payloads van de vorm `{ type: 'usage', used: N, limit: M }`. De demo-window bouwt een AI-antwoord nu live op terwijl de BudgetBar tijdens het streamen direct mee-updatet. De productievariant blijft nog geblokkeerd omdat een echte Mastra server en Hermes runtime hier nog ontbreken; daarvoor blijft B-03 leidend.

```
Hermes output → Mastra SSE endpoint → React useSandboxStream hook

GET /stream/:session_id
  Content-Type: text/event-stream
  → doorsturen van Hermes token output in real-time
  + token usage events: { type: 'usage', used: N, limit: M }
```

**Prioriteit:** Naar week 1 geschoven (was week 2) omdat live sandbox in de landing page vereist is. Test met een lange Hermes-response om te valideren dat tokens één voor één doorkomen.

---

### B-05 · Token teller + rate limiting (Mastra)
**Week:** 2-3 | **Afhankelijk van:** B-01, B-03
**Status:** â— Lokale budgetstub live; productie wacht nog op echte Mastra middleware.

**Update 7 april 2026:** In deze workspace is `B-05` lokaal opgeleverd bovenop de bestaande Vite/SSE-stub. Toegevoegd: `GET /api/tokens/status`, een sandboxbudget van `5.000` tokens per sessie, een gratis tier van `25.000` tokens per dag met reset om `00:00 UTC`, preflight-budgetchecks voor de stream, `429` responses zodra een uitgeput budget opnieuw probeert te streamen, en een `budget_exhausted` SSE-event dat tijdens een lopende stream direct een upgrade-prompt toont. De BudgetBar leest nu ook `tier`, `resets_at` en exhaustion-state uit. De productievariant blijft nog afhankelijk van echte Mastra `/agent/*` middleware en Hermes-runtime; daarvoor blijven `B-03` en de ontbrekende backend in deze workspace leidend.

**Status note:** Partial - lokale budgetstub live; productie wacht nog op echte Mastra middleware.

```
Sandbox:  5.000 tokens eenmalig, geen reset
Gratis:  25.000 tokens/dag, reset 00:00 UTC
Premium:  geen limiet

GET /tokens/status
  → { used, limit, resets_at, tier }

Middleware op alle /agent/* routes:
  → check budget voor sandbox of user
  → 429 als overschreden, met upgrade-prompt in SSE stream
```

**Opmerking:** De sandbox verbruikt tokens vóór signup. Het token-budget per sandbox (5K) bepaalt hoeveel een anonieme bezoeker kan uitproberen — houd dit mee als kostenoverweging bij beslissing #9 (LLM provider).

---

### B-06 · Hermes namespace isolatie
**Week:** 3 | **Afhankelijk van:** B-02

Gekozen model: **optie B — gedeeld proces, geïsoleerde namespaces**.

```
Hermes daemon (gedeeld proces)
  /hermes-data/
    sandbox/{sandbox_id}/
      IDENTITY.md
      USER.md
      MEMORY.md
      sessions/
    {user_id}/
      IDENTITY.md
      USER.md
      MEMORY.md
      skills/
      knowledge/
      sessions/
```

Isolatie via namespace-prefix in alle Hermes tool-calls. Geen eigen proces per user (te zwaar voor anoniem traffic).

---

### B-07 · Hermes gateway (WhatsApp + Telegram)
**Week:** 4 | **Afhankelijk van:** B-06 | **Beslissing #10 vereist**

Hermes heeft ingebouwde gateway voor Telegram, WhatsApp, Discord, Signal.

```bash
hermes gateway start
# → koppelt bestaande workspace-sessies aan messaging platforms
# → context blijft gesynchroniseerd met workspace
```

**Beslissing #10 nog open:** Aanbeveling: gebruik de ingebouwde Hermes gateway voor fase 1.

---

### B-08 · GDPR + EU data residency
**Week:** 4 | **Afhankelijk van:** B-06

- Alle user data (Hermes memory, sessies, skills) op EU servers
- `DELETE /account` verwijdert Hermes workspace volledig
- Sandbox-data: automatisch weg na TTL als niet gepromoveerd
- Hermes memory-bestanden zijn plaintext Markdown — transparant voor gebruikers
- Geen model-side data retentie (OpenRouter/OpenAI data-policies checken bij beslissing #9)

---

## Brain-modules (Sidebar > Brain)

De Brain-sectie heeft drie modules: **Tools**, **Knowledge**, **Memory**.

---

### Tools (Brain > Tools)

Twee tabs: **Connectors** en **Skills**.

#### Connectors-tab

Connectors zijn OAuth/API-koppelingen naar externe services.

**Altijd actief**: Base44 Backend (database, functions, file storage, automations).

**Beschikbare connectors (41+)**: Stripe, Gmail, Google Calendar, Google Sheets, Google Drive, LinkedIn, Google Analytics, Google Docs, Outlook, GitHub, Slack Bot, Notion, HubSpot, + 32 meer.

**Fasering:**

| Fase | Deliverable |
|------|-------------|
| **A (MVP)** | Read-only OAuth: Google Calendar, Gmail, GitHub, Outlook |
| **B** | Write-scope: Gmail sturen, Sheets schrijven, Calendar aanmaken |
| **C** | Custom connectors via OpenAPI spec upload |

**Backend-endpoints:**

```
POST /connectors/oauth/start
  body: { provider, scopes[] }
  → return: { auth_url }

POST /connectors/oauth/callback
  body: { provider, code, state }
  → encrypted token opslaan per user
  → return: { connected: true, scopes[] }

GET  /connectors/status
DELETE /connectors/{provider}
```

Hermes injecteert tokens als tool-context bij elke agent-run.

---

#### Skills-tab

Skills zijn procedurele kennisblokken (`.md`-bestanden) die Hermes vertellen hoe het een taak uitvoert.

**Huidig**: 166 skills beschikbaar, doorzoekbaar. Publisher-badge (bv. `anthropics`). Voorbeelden: `skill-creator`, `pdf`, `pptx`, `docx`, `xlsx`.

**Hoe het werkt in Hermes:**
```
/hermes-data/{user_id}/skills/
  pdf.md
  xlsx.md
  custom-naam.md
```
Skills worden dynamisch geladen als de agent bepaalt dat ze relevant zijn. Het systeem is zelfverbeterend: Hermes kan skills aanpassen op basis van outcome feedback.

**Fasering:**

| Fase | Deliverable |
|------|-------------|
| **A (MVP)** | Browse + installeren: skills-registry endpoint + install-flow |
| **B** | Management: versies, toggle, gebruik-statistieken |
| **C** | Custom skills: Markdown-editor + `skill-creator` integratie |
| **D** | Marketplace: publiceren, ratings, private libraries voor orgs |

**Backend-endpoints:**

```
GET  /skills/browse?q=&category=&page=
POST /skills/install     body: { skill_id }
DELETE /skills/{skill_id}
GET  /skills/installed
PATCH /skills/{skill_id} body: { active: bool }
```

---

### Knowledge (Brain > Knowledge)

Knowledge beheert **wie de agent is** en **wat de agent weet**. Drie sub-secties.

#### Identity + Soul

`IDENTITY.md` is het primaire systeem-prompt-fragment. Geladen als eerste context bij elke Hermes-run.

**Identity velden**: naam, avatar, persoonlijkheidsbeschrijving, toon.
**Soul**: gedragsregels en waarden — los van specifieke taken.

**Fasering:**

| Fase | Deliverable |
|------|-------------|
| **A (MVP)** | Bewerken + opslaan IDENTITY.md / SOUL.md via UI |
| **B** | Persona-templates (Personal Assistant, Research Agent, Code Agent) |
| **C** | Meerdere persona's per workspace |

#### User-profiel

Mapt op `USER.md`. Hermes **updatet dit automatisch** als het nieuwe informatie ontdekt in gesprekken.

**MVP-velden**: naam, aanspreekvorm, voornaamwoorden.

**Fasering:**

| Fase | Deliverable |
|------|-------------|
| **A (MVP)** | Basis profiel opslaan als USER.md |
| **B** | Uitgebreid profiel: functie, bedrijf, tijdzone, voorkeuren |
| **C** | Automatische verrijking: Hermes stelt updates voor op basis van gesprekken |

#### Knowledge Files

**MVP**: drag-and-drop upload (PDF, DOCX, TXT, CSV, MD, code files) → chunking + embedding → opgeslagen in `/hermes-data/{user_id}/knowledge/`.

**Fasering:**

| Fase | Deliverable |
|------|-------------|
| **A (MVP)** | Upload + indexering, bestandenlijst |
| **B** | Preview, tags, her-indexeren, zoeken |
| **C** | Knowledge graph, conflict-detectie |
| **D** | Browser extension, Google Drive / Notion auto-sync |

**Backend-endpoints:**

```
GET  /brain/knowledge/identity
PUT  /brain/knowledge/identity
GET  /brain/knowledge/files
POST /brain/knowledge/files   (multipart upload)
```

---

### Memory (Brain > Memory)

Memory beheert **wat de agent onthoudt** over de gebruiker en gesprekken.

**Hoe het werkt in Hermes:**

```
/hermes-data/{user_id}/
  MEMORY.md           ← persistent factual memory
  sessions/
    {session_id}.md   ← gecomprimeerde sessie-samenvattingen
```

MEMORY.md bevat gestructureerde feiten:
```markdown
## Facts
- User werkt als product manager bij Acme Corp
- User heeft voorkeur voor beknopte antwoorden
- Deadline Q2 review: 15 mei 2026
```

Hermes laadt relevante memory-items via retrieval per run — niet de hele file.

**Fasering:**

| Fase | Deliverable |
|------|-------------|
| **A (MVP)** | Items weergeven, handmatig toevoegen/bewerken/verwijderen |
| **B** | Automatische extractie na sessies + goedkeuringsflow |
| **C** | Categorieën: feiten, deadlines, voorkeuren, projecten, sessie-samenvattingen |
| **D** | Zoekbalk, tijdlijn, "memory used in this conversation" transparantie |
| **E** | Proactieve inzet: deadline-reminders, cross-workspace sharing (opt-in) |

**Backend-endpoints:**

```
GET    /brain/memory
POST   /brain/memory          body: { fact, category }
PATCH  /brain/memory/{id}
DELETE /brain/memory/{id}
```

---

## Technische Architectuur — Volledig Overzicht

```
React (UI)
  │
  ├── Sandbox lifecycle
  │   ├── POST /sandbox/create         → sandbox aanmaken bij page load
  │   ├── POST /sandbox/heartbeat      → TTL verlengen
  │   └── POST /sandbox/promote        → sandbox → account na signup
  │
  ├── Auth
  │   ├── POST /auth/google
  │   └── POST /auth/email/start|verify
  │
  ├── Streaming
  │   └── GET /stream/:session_id      → SSE (Hermes output + token events)
  │
  ├── Brain > Tools
  │   ├── GET/POST /connectors/...
  │   └── GET/POST/DELETE /skills/...
  │
  ├── Brain > Knowledge
  │   ├── GET/PUT /brain/knowledge/identity
  │   └── GET/POST /brain/knowledge/files
  │
  └── Brain > Memory
      ├── GET/POST /brain/memory
      ├── PATCH /brain/memory/{id}
      └── DELETE /brain/memory/{id}

Mastra (TypeScript API-laag)
  │  authenticatie + autorisatie
  │  sandbox lifecycle management
  │  token budgetten per tier
  │  schrijft/leest Hermes workspace files
  │
Hermes (Python agent runtime) — gedeeld proces, namespace-isolatie
  /hermes-data/
    sandbox/{sandbox_id}/      ← anonieme bezoekers (TTL 30 min)
    {user_id}/
      IDENTITY.md              ← agent-persona
      USER.md                  ← user-profiel
      MEMORY.md                ← persistent facts
      skills/                  ← geïnstalleerde skills
      knowledge/               ← uploaded bestanden + embeddings
      sessions/                ← sessie-samenvattingen
    connectors/                ← OAuth tokens (encrypted, per user)
```

---

## Uitvoeringsplanning (Bijgewerkt)

```
Week 1  — Fundament + live sandbox (kritieke path)
  ├── F-01  LandingPage layout              ✅     
  ├── F-02  SignupPanel (statisch)           ✅     
  ├── F-04  SandboxWorkspace shell (skeleton/loading)
  ├── F-05  ChatMessage componenten          ✅     
  ├── F-06  MorphButton component            ✅     
  ├── F-07  SSE streaming consumer hook      ✅      ← vervroegd van week 2
  ├── B-01  Auth endpoints                   ✅ (stub)
  ├── B-02  Sandbox provisioning                    ← NIEUW, blokkeert F-04
  ├── B-03  Mastra ↔ Hermes bridge (MCP)            ← blokkeert alles
  └── B-04  SSE streaming pipeline           ◐      ← lokale demo live, productie wacht op B-03

Week 2  — Integratie + streaming
  ├── F-04  SandboxWorkspace live (SSE inplugged)
  ├── F-05  BudgetBar component (token-indicator)
  ├── B-04  SSE streaming pipeline (+ token usage events) ◐
  └── B-05  Token teller (sandbox + gratis tier)

Week 3  — Shell + Brain modules
  ├── F-03  Sidebar + Brain UI shell (Tools, Knowledge, Memory tabs)
  ├── F-04  Volledige transitie-animaties (sandbox → workspace)
  ├── F-09  Routing
  ├── B-06  Hermes namespace isolatie (sandbox + user)
  └── Brain  Knowledge: Identity + User-profiel (MVP)

Week 4  — Afwerking + QA
  ├── F-10  Mobile layout
  ├── B-07  Hermes gateway (WhatsApp/Telegram)
  ├── B-08  GDPR checks (sandbox TTL cleanup, delete account)
  ├── Brain  Memory: weergeven + handmatig beheren (MVP)
  ├── Brain  Skills: browse + installeren (MVP)
  └── QA    End-to-end: landing → sandbox → Hermes → signup → promote → workspace
```

---

## Prioriteitsvolgorde openstaande beslissingen

| Prioriteit | Beslissing | Wie | Blokkeert |
|-----------|------------|-----|-----------|
| 🔴 Nu | **#2** Welk openingsbericht toont de sandbox? | Product | Eerste indruk product |
| 🟡 Week 1 | **#9** LLM provider (OpenRouter/OpenAI/Anthropic)? | Arch | Kosten sandbox per pageview |
| 🟡 Week 1 | **#1** Magic link of wachtwoord? | Product | B-01 |
| 🟠 Week 3 | **#4** Hosting EU? | DevOps | B-06, B-08 |
| 🟠 Week 3 | **#10** Hermes gateway: ingebouwd of eigen? | Arch | B-07 scope |
| 🟠 Week 3 | **#13** Knowledge embeddings: lokaal of hosted? | Arch | Brain Knowledge |
| 🟠 Week 3 | **#14** Memory-extractie: automatisch of opt-in? | Product | Brain Memory |
| ⚪ Later | **#5** Analytics (Posthog/Mixpanel/geen)? | Product | Privacy scope |
| ⚪ Later | **#15** Skills-registry: eigen of community? | Arch | Brain Skills |
| ⚪ Later | **#16** Sandbox promote-flow UI? | Frontend | F-04 promote state |
| ✅ Opgelost | Sandbox input: direct actief bij page load | Frontend | F-04 input state |

---

## Handoff voor Claude (frontend)

Start met F-01 → F-02 → F-05 → F-06 → F-07 → F-04 (shell). Deze tickets zijn bouwbaar zonder een draaiende backend. Gebruik `useSandboxStream` met een mock/stub totdat B-04 live is.

Gebruik altijd custom hooks voor Zustand-state — nooit direct `useStore()` aanroepen in componenten. Dit maakt latere refactors triviaal.

De HTML-prototype `arcamatrix-v2.html` is de enige visuele referentie. Gebruik de timingwaarden letterlijk.

MorphButton-trigger: **na eerste Hermes-response** (niet na laatste demo-bericht — er is geen demo-script meer).

## Handoff voor Codex (backend)

Start met **B-02** (sandbox provisioning) en **B-01** (auth) — onafhankelijk van elkaar en deblokkeren alles in week 2. Kies MCP voor **B-03** — `mcp_serve.py` staat al in de Hermes repo.

B-04 (SSE streaming) direct daarna — de `useSandboxStream` hook wacht hierop.
