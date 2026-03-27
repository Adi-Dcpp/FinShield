function checkMessage(text){
    if(!text || typeof text!== "string"){
        return{
            classification: "SAFE",
            signals: [],
            explanation: "Invalid or empty message."
        };
    }
    
    const lowerText = text.toLowerCase();
    const signals = [];

    if(lowerText.includes("http") ||
       lowerText.includes("www") ||
       lowerText.includes(".com") ||
       lowerText.includes(".net") ||
       lowerText.includes(".org") ||
       lowerText.includes(".biz") ||
       lowerText.includes(".xyz")
){
    signals.push("SUSPICIOUS_LINK");
    }


    if(
    lowerText.includes("win") ||
    lowerText.includes("won") ||
    lowerText.includes("prize") ||
    lowerText.includes("lottery") ||
    lowerText.includes("reward") ||
    lowerText.includes("cashback")
  ) {
    signals.push("PRIZE_BAIT");
  }


    if(
    lowerText.includes("urgent") ||
    lowerText.includes("now") ||
    lowerText.includes("verify") ||
    lowerText.includes("blocked") ||
    lowerText.includes("immediately") ||
    lowerText.includes("action required")
  ) {
    signals.push("URGENCY");
  }


  let classification = "SAFE";

  if(signals.includes("PRIZE_BAIT")){
    classification = "FRAUD";
  }

  else if(
    signals.includes("SUSPICIOUS_LINK") && signals.includes("URGENCY")
  ){
    classification = "SUSPICIOUS";
  }

  else if(
    signals.includes("SUSPICIOUS_LINK") || signals.includes("URGENCY")
  ){
    classification = "CAUTION";
  }

  let explanation = "";

  if (classification === "FRAUD") {
    explanation = `Message contains ${signals.join(" and ")}. Do Not respond.`;
  } else if (classification === "SUSPICIOUS") {
    explanation = `Message contains ${signals.join(" and ")}. Proceed with caution.`;
  } 
  else if(classification === "CAUTION"){
    explanation = `Message contains ${signals[0]}.Be careful.`;
  }
    else {
    explanation = "No suspicious patterns detected. Message appears safe.";
  }

  return {
    classification,
    signals,
    explanation,
    riskLevel: classification === "FRAUD" ? "HIGH" : classification === "SUSPICIOUS" ? "MEDIUM" : classification === "CAUTION" ? "LOW" : "NONE"
  };
}

module.exports = {checkMessage };