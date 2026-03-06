import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Load dataset
data = pd.read_csv("training_data.csv")

# Separate features and target BEFORE encoding
X = data.drop("risk", axis=1)
y = data["risk"]

# Encode features
feature_encoders = {}
for column in X.columns:
    le = LabelEncoder()
    X[column] = le.fit_transform(X[column])
    feature_encoders[column] = le

# Encode target separately
target_encoder = LabelEncoder()
y = target_encoder.fit_transform(y)

# Train model
model = DecisionTreeClassifier()
model.fit(X, y)

# Save everything
joblib.dump((model, feature_encoders, target_encoder), "model.joblib")

print("Model trained and saved successfully.")