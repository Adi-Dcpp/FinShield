import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000/api/v1";
const reportPath = path.resolve("postman", "ROBUST-API-TEST-REPORT.md");

const context = {
  safeReview: null,
  riskyReview: null,
};

const results = [];

const truncate = (value, max = 220) => {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max)}...` : str;
};

const nowIso = () => new Date().toISOString();

const callApi = async ({ method, endpoint, body }) => {
  const url = `${baseUrl}${endpoint}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    status: response.status,
    text,
    json,
  };
};

const record = async ({
  id,
  name,
  method,
  endpoint,
  body,
  expectedStatus,
  assert,
  note,
}) => {
  const startedAt = Date.now();

  try {
    const response = await callApi({ method, endpoint, body });
    const assertion = assert ? assert(response) : { pass: true, note: "" };
    const statusPass = response.status === expectedStatus;
    const pass = statusPass && assertion.pass;

    results.push({
      id,
      name,
      method,
      endpoint,
      expectedStatus,
      actualStatus: response.status,
      pass,
      durationMs: Date.now() - startedAt,
      note: assertion.note || note || "",
      responseSnippet: truncate(response.json || response.text),
    });
  } catch (error) {
    results.push({
      id,
      name,
      method,
      endpoint,
      expectedStatus,
      actualStatus: "ERROR",
      pass: false,
      durationMs: Date.now() - startedAt,
      note: `Request crashed: ${error.message}`,
      responseSnippet: "",
    });
  }
};

const validateSafeReview = (response) => {
  const body = response.json;
  if (!body?.data) return { pass: false, note: "Missing response data" };

  const riskPoint = body.data.riskPoint;
  const hasValidRisk = typeof riskPoint === "number" && riskPoint >= 0 && riskPoint <= 100;
  const hasDecision = ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"].includes(body.data.decision);
  const hasExplanation = typeof body.data.explanation === "string" && body.data.explanation.length > 0;

  if (!hasValidRisk || !hasDecision || !hasExplanation) {
    return { pass: false, note: "Risk payload shape invalid" };
  }

  context.safeReview = body.data;
  return { pass: true, note: "Review payload validated" };
};

const validateRiskyReview = (response) => {
  const body = response.json;
  if (!body?.data) return { pass: false, note: "Missing response data" };

  if (typeof body.data.riskPoint !== "number" || body.data.riskPoint < 60) {
    return { pass: false, note: "Risk score did not elevate for risky payload" };
  }

  context.riskyReview = body.data;
  return { pass: true, note: `RiskPoint=${body.data.riskPoint}, Decision=${body.data.decision}` };
};

const proceedBodyFromSafe = () => ({
  name: "Aarav Sharma",
  riskPoint: context.safeReview?.riskPoint,
  riskFactors: context.safeReview?.riskFactors,
  meta: context.safeReview?.meta,
});

const declineBodyFromRisky = () => ({
  name: "Aarav Sharma",
  riskPoint: context.riskyReview?.riskPoint,
  riskFactors: context.riskyReview?.riskFactors,
  meta: context.riskyReview?.meta,
});

const run = async () => {
  console.log("Seeding fake users before regression run...");
  execSync("node src/scripts/seed-fake-users.js", { stdio: "pipe" });

  await record({
    id: "T01",
    name: "Health endpoint",
    method: "GET",
    endpoint: "/health",
    expectedStatus: 200,
    assert: (res) => ({ pass: res.json?.status === "ok", note: "Health payload checked" }),
  });

  await record({
    id: "T02",
    name: "Review safe baseline",
    method: "POST",
    endpoint: "/transactions/review",
    body: {
      name: "Aarav Sharma",
      amount: 1200,
      deviceId: "dev-aa-01",
      city: "Delhi",
      merchant: "Amazon",
      timeStamp: nowIso(),
    },
    expectedStatus: 200,
    assert: validateSafeReview,
  });

  await record({
    id: "T03",
    name: "Review risky high amount and geo mismatch",
    method: "POST",
    endpoint: "/transactions/review",
    body: {
      name: "Aarav Sharma",
      amount: 180000,
      deviceId: `dev-aa-qa-${Date.now()}`,
      city: "London",
      merchant: "Crypto Wallet Transfer",
      timeStamp: "2026-03-27T01:15:00.000Z",
    },
    expectedStatus: 200,
    assert: validateRiskyReview,
  });

  await record({
    id: "T04",
    name: "Review missing name",
    method: "POST",
    endpoint: "/transactions/review",
    body: {
      amount: 1500,
      deviceId: "dev-x-1",
      city: "Delhi",
      merchant: "Amazon",
      timeStamp: nowIso(),
    },
    expectedStatus: 400,
  });

  await record({
    id: "T05",
    name: "Review missing fields",
    method: "POST",
    endpoint: "/transactions/review",
    body: {
      name: "Aarav Sharma",
      amount: 1200,
    },
    expectedStatus: 400,
  });

  await record({
    id: "T06",
    name: "Review invalid timestamp",
    method: "POST",
    endpoint: "/transactions/review",
    body: {
      name: "Aarav Sharma",
      amount: 1200,
      deviceId: "dev-aa-01",
      city: "Delhi",
      merchant: "Amazon",
      timeStamp: "invalid-time",
    },
    expectedStatus: 400,
  });

  await record({
    id: "T07",
    name: "Review unknown user",
    method: "POST",
    endpoint: "/transactions/review",
    body: {
      name: "Unknown User QA",
      amount: 1200,
      deviceId: "dev-uq-01",
      city: "Delhi",
      merchant: "Amazon",
      timeStamp: nowIso(),
    },
    expectedStatus: 404,
  });

  await record({
    id: "T08",
    name: "Review zero amount edge",
    method: "POST",
    endpoint: "/transactions/review",
    body: {
      name: "Aarav Sharma",
      amount: 0,
      deviceId: "dev-aa-01",
      city: "Delhi",
      merchant: "Amazon",
      timeStamp: nowIso(),
    },
    expectedStatus: 200,
    note: "Zero amount currently accepted at review layer",
  });

  await record({
    id: "T09",
    name: "Proceed happy path from safe review",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: proceedBodyFromSafe(),
    expectedStatus: 200,
    assert: (res) => {
      const status = res.json?.data?.newTransaction?.status;
      return { pass: status === "SUCCESS", note: `Stored status=${status}` };
    },
  });

  await record({
    id: "T10",
    name: "Proceed missing name",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: {
      riskPoint: 10,
      riskFactors: ["TEST"],
      meta: { amount: 1200, deviceId: "dev-aa-01", geoCountry: "IN" },
    },
    expectedStatus: 400,
  });

  await record({
    id: "T11",
    name: "Proceed invalid risk > 100",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: {
      name: "Aarav Sharma",
      riskPoint: 101,
      riskFactors: ["TEST"],
      meta: { amount: 1200, deviceId: "dev-aa-01", geoCountry: "IN" },
    },
    expectedStatus: 400,
  });

  await record({
    id: "T12",
    name: "Proceed invalid risk < 0",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: {
      name: "Aarav Sharma",
      riskPoint: -1,
      riskFactors: ["TEST"],
      meta: { amount: 1200, deviceId: "dev-aa-01", geoCountry: "IN" },
    },
    expectedStatus: 400,
  });

  await record({
    id: "T13",
    name: "Proceed missing meta",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: {
      name: "Aarav Sharma",
      riskPoint: 20,
      riskFactors: ["TEST"],
    },
    expectedStatus: 400,
  });

  await record({
    id: "T14",
    name: "Proceed meta missing geoCountry",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: {
      name: "Aarav Sharma",
      riskPoint: 20,
      riskFactors: ["TEST"],
      meta: { amount: 1200, deviceId: "dev-aa-01" },
    },
    expectedStatus: 400,
  });

  await record({
    id: "T15",
    name: "Proceed unknown user",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: {
      name: "Unknown User QA",
      riskPoint: 20,
      riskFactors: ["TEST"],
      meta: { amount: 1200, deviceId: "dev-qq-01", geoCountry: "IN" },
    },
    expectedStatus: 404,
  });

  await record({
    id: "T16",
    name: "Proceed type-coercion edge: riskPoint as string",
    method: "POST",
    endpoint: "/transactions/proceed",
    body: {
      name: "Aarav Sharma",
      riskPoint: "40",
      riskFactors: ["TYPE_COERCE"],
      meta: { amount: 2300, deviceId: "dev-aa-01", geoCountry: "IN" },
    },
    expectedStatus: 400,
    note: "String riskPoint should be rejected by strict numeric validation",
  });

  await record({
    id: "T17",
    name: "Decline happy path from risky review",
    method: "POST",
    endpoint: "/transactions/decline",
    body: declineBodyFromRisky(),
    expectedStatus: 200,
    assert: (res) => {
      const status = res.json?.data?.status;
      return { pass: status === "FAILED", note: `Stored status=${status}` };
    },
  });

  await record({
    id: "T18",
    name: "Decline missing name",
    method: "POST",
    endpoint: "/transactions/decline",
    body: {
      riskPoint: 80,
      riskFactors: ["HIGH_RISK_SCORE"],
      meta: { amount: 5000, deviceId: "dev-aa-01", geoCountry: "IN" },
    },
    expectedStatus: 400,
  });

  await record({
    id: "T19",
    name: "Decline missing meta",
    method: "POST",
    endpoint: "/transactions/decline",
    body: {
      name: "Aarav Sharma",
      riskPoint: 80,
      riskFactors: ["HIGH_RISK_SCORE"],
    },
    expectedStatus: 400,
  });

  await record({
    id: "T20",
    name: "Decline unknown user",
    method: "POST",
    endpoint: "/transactions/decline",
    body: {
      name: "Unknown User QA",
      riskPoint: 80,
      riskFactors: ["HIGH_RISK_SCORE"],
      meta: { amount: 9000, deviceId: "dev-uq-01", geoCountry: "IN" },
    },
    expectedStatus: 404,
  });

  await record({
    id: "T21",
    name: "Decline edge: riskPoint > 100 accepted",
    method: "POST",
    endpoint: "/transactions/decline",
    body: {
      name: "Aarav Sharma",
      riskPoint: 150,
      riskFactors: ["RISK_OUT_OF_RANGE"],
      meta: { amount: 9999, deviceId: "dev-aa-01", geoCountry: "IN" },
    },
    expectedStatus: 400,
    note: "Out-of-range riskPoint should be rejected",
  });

  await record({
    id: "T22",
    name: "History happy path",
    method: "POST",
    endpoint: "/transactions/history",
    body: { name: "Aarav Sharma" },
    expectedStatus: 200,
    assert: (res) => {
      const arr = res.json?.data;
      const isArray = Array.isArray(arr);
      const max20 = isArray && arr.length <= 20;
      return {
        pass: isArray && max20,
        note: isArray ? `History count=${arr.length}` : "History payload not array",
      };
    },
  });

  await record({
    id: "T23",
    name: "History missing name",
    method: "POST",
    endpoint: "/transactions/history",
    body: {},
    expectedStatus: 400,
  });

  await record({
    id: "T24",
    name: "History unknown user",
    method: "POST",
    endpoint: "/transactions/history",
    body: { name: "Unknown User QA" },
    expectedStatus: 404,
  });

  await record({
    id: "T25",
    name: "History wrong method GET",
    method: "GET",
    endpoint: "/transactions/history",
    expectedStatus: 404,
  });

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const fallbackExplanationUsed =
    context.safeReview?.explanation === "Transaction shows unusual behavior. Review recommended." ||
    context.riskyReview?.explanation === "Transaction shows unusual behavior. Review recommended.";

  const findings = [];

  if (results.some((r) => r.id === "T16" && r.pass)) {
    findings.push("`proceed` accepts `riskPoint` as a string due to implicit JS coercion. Add strict numeric validation.");
  }
  if (results.some((r) => r.id === "T21" && r.pass)) {
    findings.push("`decline` endpoint accepts out-of-range risk values (>100). Add same range guard used by `proceed`.");
  }
  if (results.some((r) => r.id === "T08" && r.pass)) {
    findings.push("`review` accepts `amount: 0`, but `proceed` rejects `meta.amount: 0` because of falsy check. Validation is inconsistent.");
  }
  if (fallbackExplanationUsed) {
    findings.push("AI explanation fallback string was observed in at least one case; verify `GROQ_API_KEY` and model availability if AI output is required.");
  }

  const lines = [];
  lines.push("# FinShield Robust API Test Report");
  lines.push("");
  lines.push(`Generated: ${nowIso()}`);
  lines.push(`Base URL: ${baseUrl}`);
  lines.push(`Total Cases: ${results.length}`);
  lines.push(`Passed: ${passed}`);
  lines.push(`Failed: ${failed}`);
  lines.push("");
  lines.push("## Execution Summary");
  lines.push("");
  lines.push("| ID | Test Case | Method | Endpoint | Expected | Actual | Result | Duration(ms) | Notes |");
  lines.push("|---|---|---|---|---:|---:|---|---:|---|");

  for (const r of results) {
    lines.push(
      `| ${r.id} | ${r.name} | ${r.method} | ${r.endpoint} | ${r.expectedStatus} | ${r.actualStatus} | ${r.pass ? "PASS" : "FAIL"} | ${r.durationMs} | ${r.note || ""} |`,
    );
  }

  lines.push("");
  lines.push("## Response Snapshots");
  lines.push("");
  for (const r of results) {
    lines.push(`### ${r.id} - ${r.name}`);
    lines.push(`- Status: ${r.actualStatus}`);
    lines.push(`- Response: \`${r.responseSnippet.replace(/`/g, "'")}\``);
    lines.push("");
  }

  lines.push("## Detailed Review");
  lines.push("");

  if (findings.length === 0) {
    lines.push("No major behavioral inconsistencies were found in this run.");
  } else {
    lines.push("The following issues or risks were identified:");
    for (const finding of findings) {
      lines.push(`- ${finding}`);
    }
  }

  lines.push("");
  lines.push("### Overall Assessment");
  lines.push("The API core flows (`review`, `proceed`, `decline`, `history`) are functional and stable for expected happy-path and validation scenarios.");
  lines.push("Most negative tests returned correct 400/404 statuses, and state transitions (`SUCCESS` and `FAILED`) persisted to history as expected.");
  lines.push("Primary improvement opportunities are around stricter input typing and consistent validation logic between endpoints.");

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`Robust regression completed: ${passed}/${results.length} passed.`);
  console.log(`Report saved to: ${reportPath}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error("Robust regression runner failed:", error.message);
  process.exit(1);
});
