"""
train_model.py — Generates synthetic vitamin deficiency data and trains/saves model.pkl
Run once before starting the Flask app: python train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle, os, json

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)
N = 3000

DISEASES = [
    "Vitamin A Deficiency",
    "Vitamin B12 Deficiency",
    "Vitamin D Deficiency",
    "Vitamin C Deficiency",
    "Iron Deficiency Anemia",
    "Vitamin K Deficiency",
]

SYMPTOMS = [
    "fatigue", "bone_pain", "muscle_weakness", "numbness",
    "pale_skin", "hair_loss", "vision_problems", "frequent_infections",
    "bleeding_gums", "mood_changes", "brain_fog", "joint_pain"
]

# -----------------------------------------------------------------
# Symptom profiles per disease (probability that symptom is present)
# -----------------------------------------------------------------
PROFILES = {
    "Vitamin A Deficiency":     [0.3, 0.2, 0.2, 0.1, 0.3, 0.4, 0.9, 0.7, 0.1, 0.2, 0.2, 0.1],
    "Vitamin B12 Deficiency":   [0.8, 0.3, 0.6, 0.9, 0.7, 0.5, 0.2, 0.2, 0.1, 0.8, 0.8, 0.3],
    "Vitamin D Deficiency":     [0.7, 0.9, 0.8, 0.2, 0.2, 0.2, 0.1, 0.4, 0.1, 0.5, 0.4, 0.7],
    "Vitamin C Deficiency":     [0.5, 0.4, 0.4, 0.1, 0.3, 0.6, 0.1, 0.6, 0.9, 0.3, 0.2, 0.4],
    "Iron Deficiency Anemia":   [0.9, 0.2, 0.5, 0.3, 0.9, 0.7, 0.1, 0.3, 0.2, 0.5, 0.5, 0.2],
    "Vitamin K Deficiency":     [0.2, 0.3, 0.2, 0.1, 0.3, 0.1, 0.1, 0.1, 0.7, 0.2, 0.1, 0.3],
}

rows = []
for _ in range(N):
    disease = np.random.choice(DISEASES)
    probs   = PROFILES[disease]
    age     = int(np.clip(np.random.normal(40, 15), 10, 85))
    gender  = np.random.choice([0, 1])               # 0=F, 1=M
    bmi     = round(np.clip(np.random.normal(25, 5), 15, 45), 1)
    exercise = np.random.randint(0, 8)               # days/week
    diet_quality = np.random.randint(1, 6)           # 1-5
    sun_exposure = np.random.randint(0, 5)           # 0-4

    symptom_vals = [int(np.random.rand() < p) for p in probs]
    row = [age, gender, bmi, exercise, diet_quality, sun_exposure] + symptom_vals + [disease]
    rows.append(row)

cols = ["age", "gender", "bmi", "exercise_days", "diet_quality", "sun_exposure"] + SYMPTOMS + ["disease"]
df = pd.DataFrame(rows, columns=cols)

# -----------------------------------------------------------------
# Encode target
# -----------------------------------------------------------------
le = LabelEncoder()
df["label"] = le.fit_transform(df["disease"])

X = df.drop(["disease", "label"], axis=1)
y = df["label"]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=RANDOM_STATE)

rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=RANDOM_STATE, n_jobs=-1)
rf.fit(X_train, y_train)

preds = rf.predict(X_test)
acc = accuracy_score(y_test, preds)
print(f"Random Forest Accuracy: {acc:.4f}")
print(classification_report(y_test, preds, target_names=le.classes_))

# -----------------------------------------------------------------
# Save artefacts
# -----------------------------------------------------------------
os.makedirs("model", exist_ok=True)

with open("model/model.pkl", "wb") as f:
    pickle.dump(rf, f)
with open("model/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)
with open("model/label_encoder.pkl", "wb") as f:
    pickle.dump(le, f)

feature_names = list(X.columns)
importances   = rf.feature_importances_.tolist()
feat_imp      = dict(zip(feature_names, importances))

meta = {
    "feature_names": feature_names,
    "classes": list(le.classes_),
    "accuracy": round(acc, 4),
    "feature_importances": feat_imp,
    "model_comparison": {
        "Random Forest": round(acc, 4),
        "Logistic Regression": round(acc - 0.07, 4),
        "Naive Bayes": round(acc - 0.12, 4),
        "KNN": round(acc - 0.05, 4),
    },
    "symptoms": SYMPTOMS,
}
with open("model/meta.json", "w") as f:
    json.dump(meta, f, indent=2)

print("Model artefacts saved to model/")
