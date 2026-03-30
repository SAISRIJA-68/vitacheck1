# 🚀 Deploy VitaCheck on Render — Step-by-Step Guide

---

## Step 1 — Create a GitHub Repository

1. Go to https://github.com/new
2. Name it: `vitacheck`
3. Set it to **Public**
4. Do NOT add README or .gitignore (already included)
5. Click **Create repository**

---

## Step 2 — Push This Project to GitHub

Open your terminal inside this folder and run:

```bash
git init
git add .
git commit -m "Initial commit - VitaCheck app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vitacheck.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 3 — Create a Render Account

1. Go to https://render.com
2. Click **Get Started for Free**
3. Sign up using your **GitHub account** (recommended)

---

## Step 4 — Create a New Web Service

1. From the Render dashboard click **"New +"** → **"Web Service"**
2. Click **"Connect account"** to link GitHub if not already done
3. Find and select your **vitacheck** repository
4. Click **Connect**

---

## Step 5 — Configure the Service

Fill in the following settings exactly:

| Field            | Value                          |
|------------------|--------------------------------|
| Name             | `vitacheck`                    |
| Region           | `Singapore` (nearest to India) |
| Branch           | `main`                         |
| Runtime          | `Python 3`                     |
| Build Command    | `./build.sh`                   |
| Start Command    | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2` |
| Instance Type    | `Free`                         |

Then click **"Create Web Service"**

---

## Step 6 — Wait for Deployment

Render will automatically:
1. Pull your code from GitHub
2. Run `build.sh` → installs packages + trains the ML model
3. Start the app with gunicorn

This takes **3–6 minutes** on first deploy.
Watch the live logs in the Render dashboard.

---

## Step 7 — Your App is Live! 🎉

Once deployed, your app will be available at:

```
https://vitacheck.onrender.com
```

(The exact URL is shown at the top of your Render service page)

---

## ⚠️ Free Tier Limitations

| Issue | Details |
|---|---|
| **Sleeps after 15 min** | First request takes ~30 seconds to wake up |
| **Model re-trains on deploy** | Each new deploy runs train_model.py (~1 min) |
| **750 hrs/month** | More than enough for demos and personal projects |

---

## 🔄 How to Update the App Later

Any push to GitHub auto-triggers a redeploy on Render:

```bash
git add .
git commit -m "Your update message"
git push
```

Render will automatically rebuild and restart. ✅

---

## 🛠️ Files Added for Deployment

| File | Purpose |
|---|---|
| `build.sh` | Installs dependencies + trains ML model on Render |
| `Procfile` | Tells Render how to start the app with gunicorn |
| `render.yaml` | Render configuration file |
| `.gitignore` | Excludes unnecessary files from GitHub |
| `requirements.txt` | Updated to include gunicorn |

---

## 🧪 Test Locally Before Deploying

```bash
pip install -r requirements.txt
python train_model.py
python app.py
# Open http://localhost:5000
```
