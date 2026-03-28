const aiExplanation = await generateMessageExplanation(
  text,
  result.signals,
  result.classification
);

if (aiExplanation) {
  result.explanation = aiExplanation;
}