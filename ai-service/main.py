from fastapi import FastAPI
import joblib
import numpy as np
from scipy.sparse import hstack
import re

app = FastAPI()

# Load model
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")


# -----------------------------
# SIGNAL DEFINITIONS
# -----------------------------
SIGNAL_RULES = {
    "PHISHING_LINK": {
        "pattern": r"(https?://\S+|www\.\S+|\.\w{2,3})",
        "weight": 30,
        "desc": "Contains suspicious link"
    },
    "PRIZE_BAIT": {
        "keywords": ["win", "won", "winner", "prize", "lottery", "reward", "cashback"],
        "weight": 25,
        "desc": "Too-good-to-be-true reward"
    },
    "OTP_SCAM": {
        "keywords": ["otp", "one time password"],
        "weight": 20,
        "desc": "Requests sensitive OTP"
    },
    "URGENCY": {
        "keywords": ["urgent", "now", "immediately", "action required", "verify", "blocked"],
        "weight": 15,
        "desc": "Uses urgency or fear tactics"
    },
    "NUMERIC_PATTERN": {
        "pattern": r"\b\d{4,6}\b",
        "weight": 10,
        "desc": "Contains suspicious numeric sequence"
    }
}


# -----------------------------
# RULE ENGINE
# -----------------------------
def analyze_rules(text):
    msg = text.lower().strip()

    signals = []
    explanations = []
    score = 0

    for signal, rule in SIGNAL_RULES.items():

        triggered = False

        # Pattern check
        if "pattern" in rule and re.search(rule["pattern"], msg):
            triggered = True

        # Keyword check
        if "keywords" in rule:
            if any(k in msg for k in rule["keywords"]):
                triggered = True

        if triggered:
            signals.append(signal)
            explanations.append(rule["desc"])
            score += rule["weight"]

    # Normalize score to 100
    risk_score = min(score, 100)

    # Risk level mapping
    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    elif risk_score > 0:
        risk_level = "LOW"
    else:
        risk_level = "NONE"

    return {
        "signals": signals,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "explanations": explanations
    }


# -----------------------------
# ML PREDICTION
# -----------------------------
def ml_predict(text):
    tfidf_vec = vectorizer.transform([text])

    try:
        length = len(text)
        num_digits = sum(c.isdigit() for c in text)
        has_url = 1 if ("http" in text or "www" in text) else 0

        extra = np.array([[length, num_digits, has_url]])
        final_input = hstack([tfidf_vec, extra])
    except:
        final_input = tfidf_vec

    pred = model.predict(final_input)[0]
    proba = model.predict_proba(final_input)[0]

    confidence = float(max(proba))

    label_map = {
        0: "SAFE",
        1: "FRAUD",
        2: "SUSPICIOUS"
    }

    return label_map.get(pred, "SAFE"), confidence


# -----------------------------
# FINAL DECISION ENGINE
# -----------------------------
def final_decision(rule_data, ml_label, confidence):
    risk_score = rule_data["risk_score"]

    # Start with ML prediction
    final = ml_label

    # Strong override (rules dominate if very risky)
    if risk_score >= 80:
        final = "FRAUD"

    # Medium conflict resolution
    elif risk_score >= 50 and ml_label == "SAFE":
        final = "SUSPICIOUS"

    # ML boost
    if confidence > 0.9 and ml_label == "FRAUD":
        final = "FRAUD"

    # False positive control
    if final == "FRAUD" and risk_score < 30:
        final = "SUSPICIOUS"

    return final


# -----------------------------
# MAIN API
# -----------------------------
@app.post("/analyze")
def analyze(data: dict):
    text = data.get("text", "")

    # Rule engine
    rule_data = analyze_rules(text)

    # ML
    ml_label, confidence = ml_predict(text)

    # Final decision
    classification = final_decision(rule_data, ml_label, confidence)

    return {
        "message": text,
        "classification": classification,
        "confidence": confidence,

        "risk_score": rule_data["risk_score"],
        "risk_level": rule_data["risk_level"],

        "signals": rule_data["signals"],

        "explanation": (
            " | ".join(rule_data["explanations"])
            if rule_data["signals"]
            else "No suspicious indicators detected."
        ),

        "ml_prediction": ml_label
    }