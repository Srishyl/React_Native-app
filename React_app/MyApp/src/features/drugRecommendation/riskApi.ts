export const predictRiskOnline = async (input: {
  disease: string;
  temp: string;
  weakness: string;
  vomiting: string;
  age: string;
}) => {
  try {
    const response = await fetch("http://10.0.2.2:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();
    return data;

  } catch (error) {
    console.log("ML API Error:", error);
    return null;
  }
};