const getDecision = (riskPoint) => {
  if (riskPoint >= 70) {
    return "BLOCK";
  } else if (riskPoint >= 35) {
    return "REVIEW";
  } else {
    return "APPROVE";
  }
};

export { getDecision };