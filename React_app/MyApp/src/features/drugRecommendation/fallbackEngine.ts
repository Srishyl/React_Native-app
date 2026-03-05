export const predictRiskOffline = (input: {
  temp: string;
  weakness: string;
  vomiting: string;
  age: string;
}) => {

  if (input.temp === "VeryHigh" && input.weakness === "Severe") {
    return { risk_level: "Emergency", confidence: null };
  }

  if (input.temp === "High" && input.vomiting === "Yes") {
    return { risk_level: "Moderate", confidence: null };
  }

  return { risk_level: "Mild", confidence: null };
};