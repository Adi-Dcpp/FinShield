# FinShield

## Project Contributors

- Kumar Gaurav Patel (AI Services)
  - Email: kgaurav3257@gmail.com
  - GitHub: https://github.com/KGaurav1207
- Chandan Kumar (Fraud Message Detection)
  - Email: chandank6380@gmail.com
  - GitHub: https://github.com/Chandan9574

AI-powered fintech fraud prevention platform with two core capabilities:

- Real-time transaction risk review (`review`, `proceed`, `decline`, `history`)
- Fraud message detection using a Python ML service + Groq explanation layer

FinShield is designed as a hackathon-ready, API-first system that focuses on fast decisions, explainability, and practical deployment on free/low-cost tiers.

## Problem It Solves

Digital fraud often succeeds before manual review can react. FinShield helps prevent loss by:

- Evaluating transaction risk before finalization
- Detecting suspicious/fraudulent messages early
- Returning clear, human-readable explanations for trust and actionability

See detailed context in:

- `problem.md`
- `prd.md`
- `Backend/FRONTEND_API_CONTRACT.md`

## Key Features

### Transaction Risk Engine

- Rule-based scoring with risk factors like amount spikes, geo mismatch, device changes, odd hour, and velocity bursts
- Decision mapping:
  - `LOW_RISK` (allow/proceed)
  - `MEDIUM_RISK` (review)
  - `HIGH_RISK` (block/decline)
- Email alert support for high-risk cases
- AI-generated explanation with deterministic fallback

### Fraud Message Detection

- Python ML + rule engine classifier returns:
  - `SAFE`
  - `SUSPICIOUS`
  - `FRAUD`
- Signal detection includes phishing links, urgency, prize bait, OTP abuse patterns
- Groq-powered user-facing explanation with fallback text if API is unavailable

## Architecture

Monorepo split into two runtime services:

1. `Backend` (Node.js + Express + MongoDB)
2. `ai-service` (FastAPI + ML artifacts)

High-level flow:

1. Client calls backend endpoint.
2. Backend computes transaction risk or calls Python message analyzer.
3. Backend uses Groq for explanation (if key exists), else deterministic fallback.
4. Backend returns structured API response.

## Repository Structure

```text
FinShield/
  Backend/
    src/
      app.js
      server.js
      controllers/
      routes/
      services/
      models/
      scripts/
    FRONTEND_API_CONTRACT.md
    package.json
  ai-service/
    main.py
    model.pkl
    vectorizer.pkl
    joblib/
  prd.md
  problem.md
  PPT_PRESENTATION_GUIDE.md
```

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- Axios, node-fetch
- Groq SDK
- Brevo transactional email SDK (`sib-api-v3-sdk`) + Mailgen
- Jest + Supertest (testing dependencies)

### AI Service

- FastAPI
- joblib
- NumPy
- SciPy
- scikit-learn compatible model artifacts (`model.pkl`, `vectorizer.pkl`)

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB instance (local or Atlas)
- API keys for optional/production-grade integrations

## Environment Variables

Create `Backend/.env` with:

```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>

GROQ_API_KEY=<your_groq_api_key>
GROQ_MODEL=llama-3.1-8b-instant

OPENCAGE_API_KEY=<your_opencage_api_key>

BREVO_API_KEY=<your_brevo_api_key>
BREVO_SENDER_EMAIL=<verified_sender_email>

FRIEND_API_URL=http://localhost:8000/analyze
TEST_BASE_URL=http://localhost:3000/api/v1
```

Notes:

- `GROQ_API_KEY` missing: explanation falls back to deterministic text.
- `OPENCAGE_API_KEY` missing/invalid: transaction review can fail with geo service error.
- `BREVO_*` missing: high-risk email sends will fail.
- `FRIEND_API_URL` should point to running FastAPI service.

## Local Setup

### 1) Start Backend

```bash
cd Backend
npm install
npm run dev
```

Default backend base URL:

- `http://localhost:3000/api/v1` (as used in API contract/tests)

### 2) Start AI Service (new terminal)

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn joblib numpy scipy scikit-learn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

AI service endpoint:

- `POST http://localhost:8000/analyze`

## API Reference (Backend)

Base path: `/api/v1`

### Health

- `GET /health`

### Transactions

- `POST /transactions/review`
- `POST /transactions/proceed`
- `POST /transactions/decline`
- `POST /transactions/history`

### Messages

- `POST /messages/check`

Detailed request/response contract and error cases:

- `Backend/FRONTEND_API_CONTRACT.md`

## Rule Logic Snapshot

Transaction risk scoring (summary):

- High amount spike
- Geo mismatch or unknown location
- New device
- Device+geo combined risk
- Unusual hour
- Merchant risk keywords
- Velocity burst (rapid transactions)

Risk score is normalized to 0-100 and mapped to decision bands.

Message detection combines:

- Rule-based signals from text patterns
- ML prediction + confidence
- Conflict-resolution logic to produce final class

## Testing

From `Backend`:

```bash
npm test
node src/scripts/run-robust-api-tests.js
```

The robust API script can generate/validate comprehensive endpoint behavior, including edge cases.

## Third-Party Services and Libraries Credit

FinShield uses the following external services/libraries:

### APIs / Platforms

- Groq API (`groq-sdk`) for explanation generation
- OpenCage Geocoding API for city-to-country enrichment
- Brevo (Sendinblue) Transactional Email API (`sib-api-v3-sdk`) for fraud alert emails
- MongoDB / MongoDB Atlas for data storage

### Open Source Libraries

- Express, Mongoose, Axios, node-fetch, dotenv
- FastAPI, NumPy, SciPy, joblib, scikit-learn
- Jest, Supertest, Nodemon

Please review and follow each provider/library license and usage terms before production deployment.

## Documentation Files

- `prd.md`: Product requirements and architecture intent
- `problem.md`: Problem framing and solution narrative
- `PPT_PRESENTATION_GUIDE.md`: Presentation/deck guidance
- `Backend/FRONTEND_API_CONTRACT.md`: Frontend-backend API contract

## Current Scope Note

This repository currently contains backend and AI service components. If a separate frontend exists, it is not included in this repository snapshot.

## License

Backend package is marked `MIT` in `Backend/package.json`.
