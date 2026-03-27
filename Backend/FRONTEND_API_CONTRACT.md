# FinShield Frontend API Contract

## Base Setup
- Base URL: `http://localhost:3000/api/v1`
- Content-Type: `application/json`

## Standard Response Shapes

### Success Shape (`status < 400`)
```json
{
  "statusCode": 200,
  "message": "...",
  "data": {},
  "success": true
}
```

### Error Shape (`status >= 400`)
```json
{
  "success": false,
  "message": "...",
  "data": null,
  "errors": []
}
```

## 1) Health Check
### `GET /health`

### Expected Success (200)
```json
{
  "status": "ok"
}
```

## 2) Review Transaction
### `POST /transactions/review`

Use this before calling `proceed` or `decline`.

### Request Body
```json
{
  "name": "Aarav Sharma",
  "amount": 1200,
  "deviceId": "dev-aa-01",
  "city": "Delhi",
  "merchant": "Amazon",
  "timeStamp": "2026-03-28T10:00:00.000Z"
}
```

### Expected Success (200)
```json
{
  "statusCode": 200,
  "message": "review generated",
  "data": {
    "riskPoint": 20,
    "riskFactors": ["VELOCITY_BURST"],
    "decision": "APPROVE",
    "explanation": "Transaction explanation text...",
    "meta": {
      "amount": 1200,
      "deviceId": "dev-aa-01",
      "geoCountry": "IN",
      "hour": 15,
      "merchant": "Amazon",
      "timestamp": "2026-03-28T10:00:00.000Z"
    }
  },
  "success": true
}
```

### Common Error Outputs
- 400: `name is required`
- 400: `all fields are required`
- 400: `invalid timestamp`
- 404: `user not found`
- 500: `geo service failed`
- 500: `transaction service failed`
- 500: `AI explanation failed`

## 3) Proceed Transaction
### `POST /transactions/proceed`

Use `riskPoint`, `riskFactors`, and `meta` directly from `/transactions/review` response.

### Request Body
```json
{
  "name": "Aarav Sharma",
  "riskPoint": 20,
  "riskFactors": ["VELOCITY_BURST"],
  "meta": {
    "amount": 1200,
    "deviceId": "dev-aa-01",
    "geoCountry": "IN",
    "hour": 15,
    "merchant": "Amazon",
    "timestamp": "2026-03-28T10:00:00.000Z"
  }
}
```

### Expected Success (200)
```json
{
  "statusCode": 200,
  "message": "transaction successful",
  "data": {
    "newTransaction": {
      "_id": "...",
      "userId": "...",
      "amount": 1200,
      "deviceId": "dev-aa-01",
      "geoCountry": "IN",
      "riskPoint": 20,
      "riskFactors": ["VELOCITY_BURST"],
      "decision": "APPROVE",
      "status": "SUCCESS"
    },
    "updatedUser": {
      "_id": "...",
      "name": "Aarav Sharma",
      "txnCount": 8,
      "avgTxnAmount": 1100
    }
  },
  "success": true
}
```

### Common Error Outputs
- 400: `name is required`
- 400: `invalid transaction payload`
- 400: `invalid meta data`
- 400: `invalid risk score`
- 404: `user not found`
- 500: `failed to save transaction`
- 500: `failed to update user stats`

### Validation Notes (important)
- `riskPoint` must be a number (`number` type), not string.
- `riskPoint` range must be `0` to `100`.
- `meta.amount` can be `0` and is still valid.

## 4) Decline Transaction
### `POST /transactions/decline`

Same payload pattern as `/transactions/proceed`.

### Request Body
```json
{
  "name": "Aarav Sharma",
  "riskPoint": 95,
  "riskFactors": ["HIGH_AMOUNT_SPIKE", "GEO_MISMATCH"],
  "meta": {
    "amount": 125000,
    "deviceId": "dev-aa-99-new",
    "geoCountry": "GB",
    "hour": 1,
    "merchant": "Crypto Wallet Transfer",
    "timestamp": "2026-03-28T01:20:00.000Z"
  }
}
```

### Expected Success (200)
```json
{
  "statusCode": 200,
  "message": "transaction declined",
  "data": {
    "_id": "...",
    "userId": "...",
    "amount": 125000,
    "deviceId": "dev-aa-99-new",
    "geoCountry": "GB",
    "riskPoint": 95,
    "riskFactors": ["HIGH_AMOUNT_SPIKE", "GEO_MISMATCH"],
    "decision": "BLOCK",
    "status": "FAILED"
  },
  "success": true
}
```

### Common Error Outputs
- 400: `name is required`
- 400: `invalid transaction payload`
- 400: `invalid meta data`
- 400: `invalid risk score`
- 404: `user not found`
- 500: `failed to save declined transaction`

### Validation Notes (important)
- `riskPoint` must be numeric and between `0` and `100`.
- `meta.amount` can be `0` and is valid.

## 5) Transaction History
### `POST /transactions/history`

### Request Body
```json
{
  "name": "Aarav Sharma"
}
```

### Expected Success (200)
```json
{
  "statusCode": 200,
  "message": "history fetched",
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "amount": 1200,
      "deviceId": "dev-aa-01",
      "geoCountry": "IN",
      "riskPoint": 20,
      "riskFactors": ["VELOCITY_BURST"],
      "decision": "APPROVE",
      "status": "SUCCESS",
      "createdAt": "..."
    }
  ],
  "success": true
}
```

### Common Error Outputs
- 400: `name is required`
- 404: `user not found`
- 500: `failed to fetch history`

## Frontend Flow Recommendation
1. Call `POST /transactions/review`.
2. Render `riskPoint`, `decision`, `riskFactors`, and `explanation` to user.
3. If user confirms transaction: call `POST /transactions/proceed` with review output.
4. If user rejects/flags: call `POST /transactions/decline` with review output.
5. Refresh activity using `POST /transactions/history`.

## Frontend Error Handling Recommendation
- Always read `response.status` and `response.message`.
- Show backend message directly for 400/404.
- For 500, show generic UI message: `Something went wrong, please try again.`
- Fallback for unknown routes returns:
```json
{
  "success": false,
  "message": "route not found",
  "data": null,
  "errors": []
}
```
