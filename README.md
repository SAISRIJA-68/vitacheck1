# VitaCheck — Vitamin Deficiency Predictor & Food Recommendation System

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the ML Model (run once)
```bash
python train_model.py
```
This generates `model/model.pkl`, `model/scaler.pkl`, `model/label_encoder.pkl`, and `model/meta.json`.

### 3. Start the Flask App
```bash
python app.py
```
Open **http://localhost:5000** in your browser.

---

## Project Structure
```
vitamin_app/
├── app.py                  # Flask backend + prediction API
├── train_model.py          # ML training script
├── requirements.txt
│
├── model/
│   ├── model.pkl           # Trained Random Forest
│   ├── scaler.pkl          # StandardScaler
│   ├── label_encoder.pkl   # LabelEncoder for diseases
│   └── meta.json           # Feature names, classes, accuracies
│
├── templates/
│   ├── home.html           # Landing page
│   ├── predict.html        # Multi-step questionnaire
│   └── results.html        # Dashboard
│
└── static/
    ├── css/
    │   └── style.css       # Full theme (dark/light)
    └── js/
        ├── main.js         # Theme toggle
        ├── predict.js      # Form logic + API call
        └── results.js      # Charts + dashboard render
```

## Features
- **6 deficiencies**: Vitamin A, B12, C, D, Iron Deficiency Anemia, Vitamin K
- **73% model accuracy** on synthetic health profiles
- Multi-step questionnaire with validation
- Animated health score ring, severity gauge, confidence bar
- 3 interactive charts: model comparison, deficiency probabilities, feature importance
- Personalised food recommendations and 4-meal diet plan
- Lifestyle suggestions and supplement advice
- Dark / light mode toggle
- Download health report as .txt

## API Endpoint
`POST /api/predict`
```json
{
  "age": 30, "gender": 0, "bmi": 22.5,
  "exercise_days": 3, "diet_quality": 3, "sun_exposure": 2,
  "symptoms": {
    "fatigue": 1, "bone_pain": 0, "muscle_weakness": 1,
    "numbness": 0, "pale_skin": 0, "hair_loss": 0,
    "vision_problems": 0, "frequent_infections": 0,
    "bleeding_gums": 0, "mood_changes": 1, "brain_fog": 1,
    "joint_pain": 0
  }
}
```
