from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()

# Load model and encoders
model, feature_encoders, target_encoder = joblib.load("model.joblib")

@app.post("/predict")
def predict(data: dict):
    try:
        # Extract input features in correct order
        features = ["disease", "temp", "weakness", "vomiting", "age"]
        input_data = []

        for feature in features:
            value = data[feature]
            encoder = feature_encoders[feature]
            encoded_value = encoder.transform([value])[0]
            input_data.append(encoded_value)

        # Convert to numpy array
        input_array = np.array([input_data])

        # Predict
        prediction_encoded = model.predict(input_array)[0]
        prediction_label = target_encoder.inverse_transform([prediction_encoded])[0]

        # Confidence score
        probabilities = model.predict_proba(input_array)[0]
        confidence = float(np.max(probabilities))

        return {
            "risk_level": prediction_label,
            "confidence": round(confidence, 2)
        }

    except Exception as e:
        return {"error": str(e)}