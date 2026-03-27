# FinShield Postman Dev Test Suite

## Files
- `FinShield-API.postman_collection.json`
- `FinShield-Local.postman_environment.json`

## Purpose
Developer-grade regression test pack for the current backend transaction APIs.
It includes smoke tests, positive paths, boundary cases, validation errors, unknown-user tests, and stateful flow validation.

## Setup
1. Start backend server:
   ```bash
   npm run dev
   ```
2. Seed fake data:
   ```bash
   node src/scripts/seed-fake-users.js
   ```
3. Import both Postman files.
4. Select `FinShield Local` environment.
5. Run full collection from top to bottom.

## Test Coverage
- Smoke: 1
- Review API: 7
- Proceed API: 5
- Decline API: 3
- History API: 3
- E2E consistency checks: 1
- Total requests: 20

## Notes
- The suite stores outputs from review requests and reuses them in proceed/decline requests.
- Negative test requests intentionally trigger 400/404 responses and are expected to pass if those codes are returned.
- If AI model/key is unavailable, explanation will fall back to deterministic text and tests still remain valid.

## Seeded Users (quick switch)
- Aarav Sharma
- Priya Verma
- Rohan Mehta
- Neha Kapoor
- Ishaan Gupta
- Sanya Iyer
- Kunal Singh
- Meera Nair
- Arjun Rao
- Kavya Menon
