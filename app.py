"""
app.py — Vitamin Deficiency Predictor Flask Backend
"""

from flask import Flask, render_template, request, jsonify, send_file
import pickle, json, os, io
import numpy as np
from datetime import datetime

app = Flask(__name__)

# ── Load artefacts ──────────────────────────────────────────────
BASE = os.path.dirname(__file__)

with open(os.path.join(BASE, "model/model.pkl"),         "rb") as f: rf      = pickle.load(f)
with open(os.path.join(BASE, "model/scaler.pkl"),        "rb") as f: scaler  = pickle.load(f)
with open(os.path.join(BASE, "model/label_encoder.pkl"), "rb") as f: le      = pickle.load(f)
with open(os.path.join(BASE, "model/meta.json"))          as f: META    = json.load(f)

# ── Knowledge base ───────────────────────────────────────────────
FOOD_DB = {
    "Vitamin A Deficiency": {
        "foods": ["Carrots", "Sweet Potato", "Spinach", "Kale", "Egg Yolks", "Liver", "Mango", "Apricots"],
        "diet_plan": {
            "morning":  "Carrot juice + boiled eggs + whole-grain toast",
            "lunch":    "Spinach dal + sweet potato curry + brown rice",
            "evening":  "Mango smoothie + mixed nuts",
            "dinner":   "Chicken liver stir-fry + steamed kale + quinoa"
        },
        "lifestyle": ["Avoid prolonged exposure to bright lights", "Include colourful vegetables daily", "Limit alcohol intake", "Get regular eye check-ups"],
        "supplements": "Beta-carotene 15 mg / day (consult your doctor)",
        "severity_foods": {"mild": 5, "moderate": 7, "severe": 10},
    },
    "Vitamin B12 Deficiency": {
        "foods": ["Salmon", "Tuna", "Eggs", "Dairy products", "Fortified cereals", "Beef", "Clams", "Nutritional yeast"],
        "diet_plan": {
            "morning":  "Fortified cereal + milk + scrambled eggs",
            "lunch":    "Tuna sandwich on whole-grain + Greek yogurt",
            "evening":  "Cheese sticks + handful of almonds",
            "dinner":   "Grilled salmon + steamed broccoli + brown rice"
        },
        "lifestyle": ["Consider B12 injections if severely deficient", "Vegetarians/vegans need supplementation", "Limit smoking", "Manage stress levels"],
        "supplements": "Cyanocobalamin 1000 µg / day (consult your doctor)",
        "severity_foods": {"mild": 4, "moderate": 6, "severe": 9},
    },
    "Vitamin D Deficiency": {
        "foods": ["Fatty fish (salmon, mackerel)", "Fortified milk", "Egg yolks", "Mushrooms", "Fortified orange juice", "Cod liver oil"],
        "diet_plan": {
            "morning":  "Fortified OJ + mushroom omelette + whole-grain toast",
            "lunch":    "Grilled mackerel + salad + fortified milk",
            "evening":  "Yogurt parfait + berries",
            "dinner":   "Baked salmon + roasted veggies + quinoa"
        },
        "lifestyle": ["Get 15–30 min sunlight daily (8–10 AM)", "Exercise outdoors regularly", "Maintain healthy body weight", "Limit excessive sunscreen during brief outdoor walks"],
        "supplements": "Vitamin D3 2000 IU / day (consult your doctor)",
        "severity_foods": {"mild": 4, "moderate": 7, "severe": 10},
    },
    "Vitamin C Deficiency": {
        "foods": ["Oranges", "Strawberries", "Bell peppers", "Kiwi", "Broccoli", "Tomatoes", "Guava", "Papaya"],
        "diet_plan": {
            "morning":  "Fresh orange juice + fruit bowl (kiwi, strawberries)",
            "lunch":    "Bell pepper & tomato salad + lentil soup",
            "evening":  "Guava or papaya slices",
            "dinner":   "Stir-fried broccoli + tofu + rice"
        },
        "lifestyle": ["Avoid smoking (destroys Vitamin C)", "Eat raw fruits/vegetables when possible", "Store fruits properly to preserve vitamins", "Reduce alcohol consumption"],
        "supplements": "Ascorbic acid 500–1000 mg / day (consult your doctor)",
        "severity_foods": {"mild": 3, "moderate": 6, "severe": 9},
    },
    "Iron Deficiency Anemia": {
        "foods": ["Spinach", "Red meat", "Lentils", "Tofu", "Quinoa", "Pumpkin seeds", "Dark chocolate", "Kidney beans"],
        "diet_plan": {
            "morning":  "Oatmeal with pumpkin seeds + orange juice (enhances iron absorption)",
            "lunch":    "Lentil soup + spinach salad + whole-grain bread",
            "evening":  "Dark chocolate + mixed nuts",
            "dinner":   "Grilled lean beef / tofu + kidney bean curry + rice"
        },
        "lifestyle": ["Pair iron foods with Vitamin C for better absorption", "Avoid tea/coffee 1h after meals", "Cook in cast-iron pans", "Get regular blood tests"],
        "supplements": "Ferrous sulfate 325 mg / day (consult your doctor)",
        "severity_foods": {"mild": 5, "moderate": 8, "severe": 10},
    },
    "Vitamin K Deficiency": {
        "foods": ["Kale", "Spinach", "Broccoli", "Brussels sprouts", "Green beans", "Fermented foods", "Prunes", "Soybeans"],
        "diet_plan": {
            "morning":  "Green smoothie (kale + spinach + banana)",
            "lunch":    "Stir-fried broccoli & Brussels sprouts + brown rice",
            "evening":  "Prunes + yogurt",
            "dinner":   "Baked tofu + soybean salad + steamed green beans"
        },
        "lifestyle": ["Avoid excessive Vitamin E/A supplements (antagonise K)", "Manage anticoagulant medications carefully", "Eat leafy greens daily", "Discuss medication interactions with doctor"],
        "supplements": "Vitamin K2 (MK-7) 120 µg / day (consult your doctor)",
        "severity_foods": {"mild": 4, "moderate": 6, "severe": 8},
    },
}

SEVERITY_RULES = {
    "mild":     {"min": 0,  "max": 33,  "color": "#22c55e", "label": "Mild"},
    "moderate": {"min": 34, "max": 66,  "color": "#f59e0b", "label": "Moderate"},
    "severe":   {"min": 67, "max": 100, "color": "#ef4444", "label": "Severe"},
}

def compute_severity_score(symptom_count: int, total_symptoms: int) -> dict:
    ratio = symptom_count / max(total_symptoms, 1)
    score = int(ratio * 100)
    if score <= 33:   level = "mild"
    elif score <= 66: level = "moderate"
    else:             level = "severe"
    return {"score": score, "level": level, **SEVERITY_RULES[level]}

def compute_health_score(severity_score: int, bmi: float, exercise: int, diet_quality: int, sun_exposure: int) -> int:
    base = 100 - severity_score
    if 18.5 <= bmi <= 24.9: base += 5
    elif bmi < 16 or bmi > 35: base -= 10
    base += min(exercise * 2, 14)
    base += (diet_quality - 1) * 3
    base += min(sun_exposure * 2, 8)
    return max(0, min(100, int(base)))

# ── Routes ───────────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("home.html")

@app.route("/predict-page")
def predict_page():
    symptoms = META["symptoms"]
    return render_template("predict.html", symptoms=symptoms)

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json
    try:
        age           = float(data["age"])
        gender        = float(data["gender"])
        bmi           = float(data["bmi"])
        exercise      = float(data["exercise_days"])
        diet_quality  = float(data["diet_quality"])
        sun_exposure  = float(data["sun_exposure"])
        symptoms_in   = data.get("symptoms", {})

        symptom_vals  = [float(symptoms_in.get(s, 0)) for s in META["symptoms"]]
        symptom_count = int(sum(symptom_vals))

        features = np.array([[age, gender, bmi, exercise, diet_quality, sun_exposure] + symptom_vals])
        import pandas as pd
        features_df = pd.DataFrame(features, columns=META["feature_names"])
        features_scaled = scaler.transform(features_df)

        proba  = rf.predict_proba(features_scaled)[0]
        pred   = int(np.argmax(proba))
        disease = le.inverse_transform([pred])[0]
        confidence = round(float(proba[pred]) * 100, 1)

        sev = compute_severity_score(symptom_count, len(META["symptoms"]))
        health_score = compute_health_score(sev["score"], bmi, exercise, diet_quality, sun_exposure)

        db = FOOD_DB.get(disease, {})
        top_probs = sorted(
            [{"disease": le.inverse_transform([i])[0], "prob": round(float(p)*100, 1)} for i, p in enumerate(proba)],
            key=lambda x: -x["prob"]
        )

        return jsonify({
            "success": True,
            "disease": disease,
            "confidence": confidence,
            "health_score": health_score,
            "severity": sev,
            "foods": db.get("foods", []),
            "diet_plan": db.get("diet_plan", {}),
            "lifestyle": db.get("lifestyle", []),
            "supplements": db.get("supplements", ""),
            "all_probs": top_probs,
            "feature_importances": META["feature_importances"],
            "model_comparison": META["model_comparison"],
            "symptom_count": symptom_count,
            "total_symptoms": len(META["symptoms"]),
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/results")
def results():
    return render_template("results.html")

@app.route("/api/meta")
def meta():
    return jsonify(META)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
