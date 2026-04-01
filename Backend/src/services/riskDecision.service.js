const getDecision = (riskPoint) => {
  if (riskPoint >= 70) {
    return "HIGH_RISK";
  } else if (riskPoint >= 35) {
    return "MEDIUM_RISK";
  } else {
    return "LOW_RISK";
  }
};

export { getDecision };