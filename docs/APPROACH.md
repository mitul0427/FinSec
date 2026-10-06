# Project Approach & Architecture — Build Secure 24

**Team ID:** 74  
**Project Name:** FinSec ZeroTrust (PS-01: FinTrack — Personal Finance & AI Assistant)  
**Team Size:** 4 Members  
**Primary Track / Domain:** PS-01: FinTrack (Personal Finance, Financial Security & AI Assistant)

---

## 1. Problem Understanding, Scope & Threat Model

### 1.1 Problem Statement & Real-World Motivation
Modern personal finance applications manage highly confidential user financial records, account balances, transaction history, receipts, and budgeting targets. Traditional FinTech solutions suffer from critical vulnerabilities:
1. **Credential Vulnerability & Phishing:** Password-based authentication remains susceptible to credential stuffing, dictionary attacks, and phishing.
2. **Insecure Data Ingestion & OCR Exploits:** Receipt image uploads are vectors for malicious polyglot files, image-embedded malware, and EXIF geolocation data leaks.
3. **Application Layer Tampering & Injection:** Flawed query construction and client-controlled inputs risk SQL injection, cross-site scripting (XSS), and unauthorized balance tampering.
4. **Audit Trail Mutability:** In standard architectures, compromised database accounts or rogue administrators can overwrite or delete access logs to conceal illicit modifications.

**FinSec ZeroTrust** solves this by enforcing an end-to-end **Zero Trust Architecture (ZTA)** across the entire financial lifecycle: passwordless WebAuthn/FIDO2 credentials, short-lived JWT access tokens with rotating HttpOnly refresh cookies, HMAC-SHA256 request payload integrity verification, active SQLi detection middleware, decoy honeypots with real-time SOC alerting, and an immutable append-only database audit log.

### 1.2 Target Users & Personas
- **End-User (Financial Consumer):** Manages personal transactions, uploads receipts for automated AI parsing, visualizes spending trends, configures budgets, and chats with an AI Financial Assistant. Operates under the `USER` role.
- **Security Auditor / SOC Administrator (`ADMIN`):** Monitors real-time threat maps, tracks blocked intrusion attempts, reviews immutable audit logs, inspects honeypot triggers, and administers user permissions.

### 1.3 Threat Model & Attack Surface (STRIDE & OWASP Top 10)

| STRIDE Category | Threat Description | FinSec ZeroTrust Mitigation |
|---|---|---|
| **Spoofing** | Attacker impersonates a legitimate user via stolen passwords or intercepted tokens. | Passwordless WebAuthn (Passkeys) using `@simplewebauthn`, 5-minute ephemeral JWTs, and cryptographically bound refresh tokens stored in HttpOnly, SameSite=Strict cookies. |
| **Tampering** | Man-in-the-Middle (MitM) modifies transaction amounts or budget thresholds in transit. | HMAC-SHA256 request signature verification headers on non-GET endpoints; input schema validation via Zod; immutable `SecurityLog` via Prisma middleware. |
| **Repudiation** | User or rogue admin modifies financial records and deletes the audit log. | Append-only `SecurityLog` with Prisma runtime middleware intercepting and blocking all `update`, `updateMany`, `delete`, and `deleteMany` operations. |
| **Information Disclosure** | Sensitive EXIF data (GPS coordinates, camera metadata) leaked via receipt images; PII leaked in errors. | Automated metadata stripping via `exif-parser`, magic-byte file validation with `file-type`, sanitized error handling, and strict HTTP security headers via `helmet`. |
| **Denial of Service (DoS)** | Malicious actor spams endpoints to exhaust database connections or server CPU. | Strict per-IP rate limiting (`express-rate-limit` capped at 5 req/sec), body size limits (10MB for multipart, 100KB for JSON), and honeypot auto-IP-banning. |
| **Elevation of Privilege** | Standard `USER` invokes administrative or SOC monitoring APIs. | Role-Based Access Control (RBAC) middleware verifying cryptographic JWT claims before routing to `/api/v1/admin/*`. |

---

## 2. Technical Architecture & Secure System Design

### 2.1 High-Level Architecture Overview
FinSec ZeroTrust follows a decoupled multi-tier architecture with defense-in-depth boundaries:
1. **Presentation Tier (`src/frontend`):**
   - React 18 single-page application built on Vite.
   - Tailwind CSS for modern, high-contrast, security-first dark mode UI.
   - Recharts for dynamic visual financial summaries and category breakdown.
   - React-Leaflet for interactive global SOC threat mapping.
   - WebAuthn browser client (`@simplewebauthn/browser`) for passkey registration and biometric challenge response.
   - DOMPurify sanitization on all dynamic inputs and message streams.
2. **Ingress & Security Gateway Tier (`src/backend`):**
   - Express 4 server with Helmet security headers, CORS restrictions, and per-IP rate limiting.
   - Active Defense Layer: Honeypot traps (`/api/v1/admin/login-v1`), SQL injection regex inspection, and HMAC-SHA256 signature verification.
   - Socket.io event emitter broadcasting real-time security events to connected SOC admin clients.
3. **Domain & AI Processing Tier:**
   - Transaction & Budget Management Engine with threshold alerts.
   - Receipt Vision AI Pipeline: Multer in-memory stream -> `file-type` magic bytes verification -> `exif-parser` metadata stripping -> Google Gemini Vision API for structured JSON extraction.
   - AI Natural Language Financial Assistant: Conversational agent with strict Zod schema grounding to prevent prompt injection and tool hallucination.
4. **Data Persistence Tier:**
   - Prisma ORM interfacing with SQLite (local development zero-dependency mode) or PostgreSQL (production containerized).
   - Immutable Prisma extension enforcing append-only semantics on `SecurityLog`.

### 2.2 Data Flow & Component Interaction

```text
[ Client (Browser / Passkey / React) ]
               │
               ▼  (HTTPS / HMAC-SHA256 Headers / CSP)
[ Express Security Gateway ]
   ├── Rate Limiting (5 req/sec)
   ├── Helmet Headers & CORS
   ├── SQLi Request Body Inspection
   ├── Honeypot Decoy Router (/api/v1/admin/login-v1) ──► [ Socket.io SOC Broadcast ]
   └── JWT / WebAuthn RBAC Guard
               │
               ├──► [ Core Financial Controller ] ──► [ Prisma ORM ] ──► [ Database (User, Transaction, Budget) ]
               │
               ├──► [ Receipt OCR / Vision Controller ]
               │      ├── 1. Magic Bytes Validation (file-type)
               │      ├── 2. EXIF Metadata Stripping (exif-parser)
               │      └── 3. Google Gemini 2.0 API ──► Structured Transaction JSON
               │
               ├──► [ Financial AI Assistant ] ──► Structured Output (Zod Schema)
               │
               └──► [ Security Event Logger ] ──► [ Immutable SecurityLog (Append-Only) ]
```

### 2.3 Technology Stack Rationale

- **Backend (Node.js & Express):** Lightweight, asynchronous non-blocking event loop ideal for simultaneous Socket.io WebSocket connections, RESTful APIs, and streaming image uploads.
- **ORM (Prisma):** Provides 100% parameterized queries eliminating raw SQL injection vectors, full TypeScript-safe models, and runtime client extensions for immutable audit logging.
- **Frontend (React + Vite + Tailwind):** Sub-second HMR development, componentized UI, modular state management, and optimized production bundle.
- **Security & Cryptography:** `@simplewebauthn` for W3C/FIDO2 compliant authentication, `bcrypt` for one-way password hashing (fallback), `crypto` for HMAC-SHA256 signatures, and `DOMPurify` for client-side XSS defense.
- **AI (Google Gemini):** Multi-modal vision capabilities for zero-shot receipt parsing and structured financial reasoning.

---

## 3. Implementation Milestones & 24-Hour Timeline

| Milestone / Phase | Time Window | Key Objectives & Deliverables | Security Verification | Status |
|---|---|---|---|---|
| **Phase 1: Foundation & Setup** | 0h – 3h | Repo onboarding, logs verification, architecture lock, Prisma schema definition | Secret scan & baseline check | `Completed` |
| **Phase 2: The Fortress (Auth & Gateway)** | 3h – 8h | WebAuthn passkeys, JWT + rotating HttpOnly cookies, RBAC, HMAC signing, rate-limiting | Auth test suite & crypto validation | `In Progress` |
| **Phase 3: Core PS-01 Financial & AI Engine** | 8h – 14h | Transaction CRUD, budgets, CSV/JSON export, Receipt Vision AI, AI Assistant | Magic-byte checks & schema validation | `In Progress` |
| **Phase 4: Active Defense & SOC Dashboard** | 14h – 19h | Honeypot routes, SQLi body inspector, Leaflet SOC threat map, append-only log | SAST scanning, tamper resistance test | `In Progress` |
| **Phase 5: Integration, Docker & Code Freeze** | 19h – 24h | Full end-to-end integration, Docker Compose setup, final verification, SHA freeze | Automated test pass & freeze lock | `Planned` |

---

## 4. Architecture Decision Records (ADRs)

### ADR-001: Adoption of WebAuthn (FIDO2) as Primary Authentication
- **Status:** Accepted
- **Context:** Financial applications are prime targets for phishing and credential-stuffing attacks. Passwords represent a systemic security liability.
- **Decision:** Implement WebAuthn using `@simplewebauthn/server` and `@simplewebauthn/browser` for biometric/security key passwordless login, maintaining bcrypt + JWT as an optional fallback.
- **Trade-off:** Requires secure HTTPS / localhost context for WebAuthn APIs; provides cryptographic immunity against phishing.

### ADR-002: Dual Database Support (SQLite Default with PostgreSQL Compose)
- **Status:** Accepted
- **Context:** Hackathon evaluation environments vary between containerized servers and standalone developer machines.
- **Decision:** Structure Prisma models to execute seamlessly on SQLite with zero external dependencies, while shipping a production `docker-compose.yml` for PostgreSQL.
- **Trade-off:** SQLite handles high single-node throughput with zero operational friction; Postgres provides multi-client concurrency.

### ADR-003: Immutable Append-Only Audit Logging via Prisma Middleware
- **Status:** Accepted
- **Context:** SOC auditors require guarantees that security incident records cannot be modified or purged post-breach.
- **Decision:** Implement Prisma client runtime extension intercepting `update`, `updateMany`, `delete`, and `deleteMany` queries targeted at the `SecurityLog` model, rejecting them with an `ImmutableSecurityLogError`.
- **Trade-off:** Prevents log compaction inside the primary database; guarantees cryptographic non-repudiation.

### ADR-004: In-Memory Multi-Stage Image Sanitization Pipeline
- **Status:** Accepted
- **Context:** Uploaded receipt images could contain malicious file payloads or leak sensitive EXIF GPS locations.
- **Decision:** Process images strictly in memory via Multer buffer -> validate real magic bytes using `file-type` -> strip EXIF tags using `exif-parser` before forwarding sanitized buffer to Gemini API.
- **Trade-off:** Minor memory overhead per concurrent upload; complete prevention of stored polyglot files and metadata leaks.

### ADR-005: Real-Time Bank Anomaly & Two-Phase Execution Engine
- **Status:** Accepted
- **Context:** Automated bank integrations are vulnerable to fraudulent or geographically impossible fund drains.
- **Decision:** Implement `/api/bank/webhook/transaction` with a pre-commit AI Anomaly Engine evaluating 30-day category spending multipliers (>3x average) and geographic baseline impossibility. Flagged transactions default to `PENDING_CONFIRMATION` without deducting balance, pushing an interactive Socket.io approval/block modal to the client. Blocking triggers an instant Honeypot alarm and security log.
- **Trade-off:** Adds an approval step for high-risk anomalies; completely shields user liquidity from fraudulent automated syncs.

---

## 5. Engineering Journal & Real-Time Decision Log

### [2026-10-05 12:56 IST] Entry 1: Competition Onboarding & Agreement Verification
- **Focus:** Read and agreed to `AGENTS.md` and competition rules. Initialized `docs/logs.txt` with verified agreement.
- **Key Challenges:** Maintaining append-only timeline integrity without rewriting prior turns.
- **Resolution:** Established automated git staging and commit routine before logging every turn.

### [2026-10-05 13:05 IST] Entry 2: Team Metadata & Track Alignment
- **Focus:** Registered Team ID 74 (SleNova), verified 4 registered members, linked GitHub repository `https://github.com/mitul0427/FinSec.git`, and locked track PS-01 (FinTrack).
- **Key Challenges:** Ensuring strict adherence to team size rules (exactly 4 members).
- **Resolution:** Validated and populated `metadata/team.yaml` and `metadata/submission.yaml`.

### [2026-10-05 13:15 IST] Entry 3: Comprehensive Architecture & Security Blueprint Lock
- **Focus:** Authored `docs/APPROACH.md` detailing the 4 security pillars: Core PS-01 Financial App, The Fortress (WebAuthn/HMAC/RBAC), Active Defense (Honeypot/SQLi filter/XSS), and SOC Dashboard.
- **Key Challenges:** Blending high-velocity financial tracking features with uncompromising Zero Trust security controls.
- **Resolution:** Layered defense-in-depth architecture separating ingress security gateway, domain services, AI pipelines, and immutable audit logs.

### [2026-10-06 10:40 IST] Entry 4: Rapid Hardening & Real-Time Bank Anomaly Integration
- **Focus:** Fixed Gemini 1.5 Flash Vision OCR dynamic base64 extraction; created bank webhook simulation and AI anomaly engine with Socket.io real-time approval/block modal; hardened IDOR protection (`ensureOwnership` middleware), strict endpoint rate limits, and DOMPurify sanitization.
- **Key Challenges:** Maintaining production Vite build integrity and zero-downtime ledger consistency under strict competition deadlines.
- **Resolution:** Tested full end-to-end build, verified Prisma database schema push with status fields, and verified server syntax.

---

## 6. Testing, Security Verification & Deployment Record

### 6.1 Testing & Security Verification Strategy
- **Unit & Integration Testing:** Automated test suites verifying JWT issuance, WebAuthn challenge generation, HMAC signature verification, SQLi filtering regex, and transaction CRUD operations.
- **Active Defense Verification:** Simulated attacks against the Honeypot endpoint (`/api/v1/admin/login-v1` and `/api/admin/login-v1`) to verify instant IP banning and Socket.io SOC event dispatch.
- **Immutability Verification:** Scripted attempt to execute `prisma.securityLog.delete()` verifying execution failure.
- **IDOR Protection Verification:** Verified `ensureOwnership` denies cross-tenant resource modification with HTTP 403.

### 6.2 Deployment Verification
- **Containerization:** Root `docker-compose.yml` defining `backend`, `frontend`, and `postgres` container services with complete health checks.
- **Frontend Production Bundle:** `npm run build` generates optimized distribution assets in `src/frontend/dist/`.
- **Environment Documentation:** Root `.env.example` documents all required secrets, database strings, and WebAuthn configs.
- **Health Check Endpoint:** `GET /health` and `GET /api/v1/health` returning system uptime, database status, and active defense status.
