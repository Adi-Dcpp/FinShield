const calculateRisk = (user, transaction, txnCountIn10Mins) => {
  const riskFactors = [];
  let riskPoint = 0;
  const { amount, geoCountry, deviceId, hour, merchant = "" } = transaction;
  const { avgTxnAmount, homeCountry, usualDevices } = user;
  const isNewDevice = !usualDevices.includes(deviceId);
  const isUnknownLocation = !geoCountry;
  const isGeoMismatch = geoCountry && geoCountry !== homeCountry;

  if (avgTxnAmount > 0 && amount > 3 * avgTxnAmount) {
    riskPoint += 25;
    riskFactors.push("HIGH_AMOUNT_SPIKE");
  }

  if (amount > 100000) {
    riskPoint += 20;
    riskFactors.push("VERY_HIGH_AMOUNT");
  }

  if (isNewDevice) {
    riskPoint += 15;
    riskFactors.push("NEW_DEVICE");
  }

  if (isUnknownLocation) {
    riskPoint += 10;
    riskFactors.push("UNKNOWN_LOCATION");
  } else if (isGeoMismatch) {
    riskPoint += 20;
    riskFactors.push("GEO_MISMATCH");
  }

  if (hour >= 0 && hour <= 5) {
    riskPoint += 10;
    riskFactors.push("UNUSUAL_TIME");
  }

  if (txnCountIn10Mins >= 3 && txnCountIn10Mins < 5) {
    riskPoint += 10;
    riskFactors.push("MILD_VELOCITY");
  } else if (txnCountIn10Mins >= 5) {
    riskPoint += 20;
    riskFactors.push("VELOCITY_BURST");
  }

  if (isNewDevice && (isUnknownLocation || isGeoMismatch)) {
    riskPoint += 10;
    riskFactors.push("DEVICE_GEO_COMBO");
  }

  if ((amount > 3 * avgTxnAmount || amount > 100000) && txnCountIn10Mins > 3) {
    riskPoint += 10;
    riskFactors.push("AMOUNT_VELOCITY_COMBO");
  }

  if (
    ["crypto", "bet", "casino", "wallet"].some((k) =>
      merchant.toLowerCase().includes(k),
    )
  ) {
    riskPoint += 10;
    riskFactors.push("RISKY_MERCHANT");
  }

  if (riskPoint > 100) {
    riskPoint = 100;
  }
  return {
    riskFactors,
    riskPoint,
  };
};

export { calculateRisk }