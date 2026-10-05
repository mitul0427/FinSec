# FinSec ZeroTrust — Personal Finance & AI Assistant (PS-01)

**Build Secure 24 — Official Hackathon Project**  
**Team ID:** 74 | **Team Name:** SleNova | **Track:** PS-01 (FinTrack: Personal Finance & AI Assistant)  
**Live Repository:** [https://github.com/mitul0427/FinSec.git](https://github.com/mitul0427/FinSec.git)

---

## 1. Project Overview

**FinSec ZeroTrust** is an enterprise-grade, secure personal finance platform engineered with a strict **Zero Trust Architecture (ZTA)**. Combining comprehensive financial tracking (income/expense CRUD, budget threshold monitoring, Recharts analytics, CSV/JSON export) with cutting-edge cybersecurity and multi-modal AI (Google Gemini 2.0 OCR & Financial Assistant), FinSec ZeroTrust ensures financial data remains untampered, non-repudiable, and protected against modern attack vectors.

### Key Pillars & Security Innovations:
1. **Core PS-01 Financial Engine & AI:** Complete transaction management, multi-category budgeting with live threshold alerts, CSV/JSON data export, multi-stage sanitizing Receipt Vision AI (magic-bytes verification + EXIF stripping + Gemini OCR), and conversational AI assistant grounded by Zod schemas.
2. **The Fortress (Authentication & Gateway Security):** Passwordless WebAuthn / FIDO2 Passkeys with biometric/hardware key support, short-lived 5-minute JWTs with rotating HttpOnly Secure cookies, RBAC (`USER` vs `ADMIN`), HMAC-SHA256 request signature verification, and 5 req/sec rate limiting.
3. **Active Defense (Intrusion Detection & Sanitization):** Decoy honeypot endpoints (`/api/v1/admin/login-v1`) that auto-ban malicious IPs and emit real-time alerts, proactive SQL injection body inspection, and client-side DOMPurify with strict Content Security Policy.
4. **The SOC Dashboard & Post-Deployment Analysis:** Interactive global threat map powered by React-Leaflet and Socket.io, real-time pulsing attack markers by IP geolocation, and an immutable append-only `SecurityLog` audit table enforced by Prisma runtime middleware.

---

## 2. Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                       React 18 + Vite                       │
│      Tailwind CSS • Recharts • React-Leaflet • DOMPurify     │
│             WebAuthn Browser • Socket.io Client             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / HMAC-SHA256 Signatures
┌──────────────────────────────▼──────────────────────────────┐
│                    Express Security Gateway                 │
│      Helmet CSP • Rate Limiting • SQLi Inspection Filter     │
│          Honeypot Trap ──► Real-Time Socket.io Alert        │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
┌───────────────▼──────────────┐┌──────────────▼──────────────┐
│       Core Finance & AI      ││     The Fortress Security    │
│ • Income/Expense CRUD        ││ • WebAuthn / FIDO2 Passkeys │
│ • Budget Alerts & Export     ││ • 5-min JWT + Cookie Rotate │
│ • Receipt Vision AI (Gemini) ││ • HMAC Request Verification │
│ • Natural Language Assistant ││ • Role-Based Access (RBAC)  │
└───────────────┬──────────────┘└──────────────┬──────────────┘
                │                              │
┌───────────────▼──────────────────────────────▼──────────────┐
│                      Prisma ORM Layer                        │
│          Immutable Append-Only SecurityLog Middleware       │
│                  SQLite / PostgreSQL Storage                 │
└─────────────────────────────────────────────────────────────┘
```

### Technology Matrix:
- **Frontend (`src/frontend`):** React 18, Vite, Tailwind CSS, Recharts, React-Leaflet, Lucide Icons, `@simplewebauthn/browser`, DOMPurify.
- **Backend (`src/backend`):** Node.js, Express, Prisma ORM, Socket.io, `@simplewebauthn/server`, `express-rate-limit`, `helmet`, `file-type`, `exif-parser`, `jsonwebtoken`, `bcrypt`, `zod`.
- **AI Engine:** Google Gemini API (Multi-modal Vision OCR & Structured Financial Assistant).
- **Database:** SQLite (default zero-friction development) & PostgreSQL (`docker-compose.yml`).

---

## 3. Getting Started & Running Locally

### Prerequisites
- Node.js (v18+ or v25+)
- npm or yarn

### Quick Start (Development Mode)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mitul0427/FinSec.git
   cd FinSec
   ```

2. **Start the Backend:**
   ```bash
   cd src/backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```
   *The backend will boot on `http://localhost:5000` with SQLite database initialized.*

3. **Start the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *The frontend dashboard will be available at `http://localhost:5173`.*

---

## 4. Docker Deployment

To spin up the entire production environment with PostgreSQL:

```bash
docker-compose up --build -d
```

Services exposed:
- Frontend: `http://localhost:3000` (or `http://localhost:5173`)
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 5. API Reference Summary

| Method | Endpoint | Description | Security Controls |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create user account | Bcrypt password hash, Zod validation |
| `POST` | `/api/v1/auth/login` | Authenticate & issue JWT | Rate limited, 5-min JWT + HttpOnly refresh cookie |
| `POST` | `/api/v1/auth/webauthn/generate-registration-options` | Begin passkey enrollment | Authenticated, cryptographically verified |
| `POST` | `/api/v1/auth/webauthn/verify-registration` | Complete passkey enrollment | WebAuthn challenge verification |
| `POST` | `/api/v1/auth/webauthn/generate-authentication-options` | Begin passkey login | Anti-replay challenge |
| `POST` | `/api/v1/auth/webauthn/verify-authentication` | Complete passkey login | FIDO2 signature check |
| `GET` | `/api/v1/transactions` | List/filter transactions | JWT Auth, sanitized query params |
| `POST` | `/api/v1/transactions` | Create income/expense | HMAC-SHA256 signature, Zod schema |
| `GET` | `/api/v1/transactions/export` | Download financial CSV/JSON | JWT Auth, rate-limited |
| `POST` | `/api/v1/receipts/scan` | AI Receipt Vision & OCR | `file-type` magic bytes, `exif-parser` stripping |
| `POST` | `/api/v1/ai/assistant` | Conversational Financial AI | Gemini 2.0 with Zod schema action mapping |
| `POST` | `/api/v1/admin/login-v1` | **Honeypot Decoy Trap** | Auto-ban IP, emit Socket.io SOC alert |
| `GET` | `/api/v1/admin/soc/logs` | Immutable Security Audit Log | `ADMIN` RBAC guard, tamper-proof |

---

## 6. Security Assurance & Evaluation Compliance

- **Immutable Trust Root:** `AGENTS.md` is strictly preserved and validated.
- **Append-Only Logging:** Every AI prompt, response, file modification, and Git commit hash is recorded in `docs/logs.txt`.
- **Live Authorship:** Authored live within the 24-hour hackathon window in `src/`.
- **Zero-Trust Enforcement:** No request is trusted implicitly; all inputs are validated, sanitized, and audited.
