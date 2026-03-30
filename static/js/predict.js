// predict.js — Questionnaire logic

const SYMPTOMS_META = {
  fatigue:             { label:'Fatigue',             icon:'😴' },
  bone_pain:           { label:'Bone Pain',           icon:'🦴' },
  muscle_weakness:     { label:'Muscle Weakness',     icon:'💪' },
  numbness:            { label:'Numbness / Tingling', icon:'🖐️' },
  pale_skin:           { label:'Pale Skin',           icon:'🫗' },
  hair_loss:           { label:'Hair Loss',           icon:'💆' },
  vision_problems:     { label:'Vision Problems',     icon:'👁️' },
  frequent_infections: { label:'Frequent Infections', icon:'🦠' },
  bleeding_gums:       { label:'Bleeding Gums',       icon:'🦷' },
  mood_changes:        { label:'Mood Changes',        icon:'🌡️' },
  brain_fog:           { label:'Brain Fog',           icon:'🧠' },
  joint_pain:          { label:'Joint Pain',          icon:'🦵' },
};

const DIET_LABELS = ['', 'Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
const SUN_LABELS  = ['None', 'Minimal', 'Moderate', 'Regular', 'Frequent'];

// ── Build symptom checkboxes ──────────────────────────────────
function buildSymptoms() {
  const grid = document.getElementById('symptomGrid');
  if (!grid) return;
  const keys = Object.keys(SYMPTOMS_META);
  keys.forEach(k => {
    const meta = SYMPTOMS_META[k];
    const pill = document.createElement('div');
    pill.className = 'symptom-pill';
    pill.dataset.key = k;
    pill.innerHTML = `${meta.icon} ${meta.label} <span class="check">✓</span>`;
    pill.addEventListener('click', () => toggleSymptom(pill));
    grid.appendChild(pill);
  });
}

function toggleSymptom(pill) {
  pill.classList.toggle('selected');
  document.getElementById('selectedCount').textContent =
    document.querySelectorAll('.symptom-pill.selected').length;
}

// ── Step navigation ───────────────────────────────────────────
function goStep(n) {
  if (n === 2 && !validateStep1()) return;
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + n).classList.add('active');
  document.querySelectorAll('.step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.toggle('active', sn === n);
    s.classList.toggle('done',   sn < n);
  });
  window.scrollTo({ top: 80, behavior: 'smooth' });
}

// ── Validation ────────────────────────────────────────────────
function validateStep1() {
  let ok = true;

  const age = parseFloat(document.getElementById('age').value);
  const ageErr = document.getElementById('age-err');
  if (!age || age < 10 || age > 85) {
    ageErr.textContent = 'Please enter age between 10 and 85.';
    document.getElementById('age').classList.add('error');
    ok = false;
  } else {
    ageErr.textContent = '';
    document.getElementById('age').classList.remove('error');
  }

  const genderSel = document.querySelector('input[name="gender"]:checked');
  const genderErr = document.getElementById('gender-err');
  if (!genderSel) {
    genderErr.textContent = 'Please select your gender.';
    ok = false;
  } else {
    genderErr.textContent = '';
  }

  const bmi = parseFloat(document.getElementById('bmi').value);
  const bmiErr = document.getElementById('bmi-err');
  if (!bmi || bmi < 10 || bmi > 50) {
    bmiErr.textContent = 'Please enter a valid BMI (10–50).';
    document.getElementById('bmi').classList.add('error');
    ok = false;
  } else {
    bmiErr.textContent = '';
    document.getElementById('bmi').classList.remove('error');
  }

  return ok;
}

// ── BMI visual bar ────────────────────────────────────────────
document.getElementById('bmi')?.addEventListener('input', function() {
  const v = parseFloat(this.value);
  if (!v) return;
  const pct = Math.min(Math.max((v - 10) / (50 - 10) * 100, 0), 100);
  const marker = document.getElementById('bmiMarker');
  if (marker) marker.style.left = pct + '%';
});

// ── Sliders ───────────────────────────────────────────────────
document.getElementById('exercise')?.addEventListener('input', function() {
  document.getElementById('exerciseVal').textContent = this.value + ' day' + (this.value == 1 ? '' : 's');
});
document.getElementById('sun')?.addEventListener('input', function() {
  document.getElementById('sunVal').textContent = SUN_LABELS[this.value];
});

// ── Star rating ───────────────────────────────────────────────
document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    const val = parseInt(star.dataset.val);
    document.getElementById('diet_quality').value = val;
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= val);
    });
    document.getElementById('dietLabel').textContent = DIET_LABELS[val];
  });
});
// Set default 3 stars active
document.querySelectorAll('.star').forEach(s => {
  if (parseInt(s.dataset.val) <= 3) s.classList.add('active');
});

// ── Submit prediction ─────────────────────────────────────────
async function submitPrediction() {
  const symptoms = {};
  document.querySelectorAll('.symptom-pill').forEach(p => {
    symptoms[p.dataset.key] = p.classList.contains('selected') ? 1 : 0;
  });

  const payload = {
    age:           parseFloat(document.getElementById('age').value),
    gender:        parseFloat(document.querySelector('input[name="gender"]:checked')?.value ?? 0),
    bmi:           parseFloat(document.getElementById('bmi').value),
    exercise_days: parseFloat(document.getElementById('exercise').value),
    diet_quality:  parseFloat(document.getElementById('diet_quality').value),
    sun_exposure:  parseFloat(document.getElementById('sun').value),
    symptoms,
  };

  // Show loader
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('hidden');
  const steps = ['ls1','ls2','ls3','ls4'];
  let si = 0;
  const interval = setInterval(() => {
    if (si > 0) document.getElementById(steps[si-1])?.classList.add('done');
    if (si < steps.length) document.getElementById(steps[si])?.classList.add('active');
    si++;
    if (si > steps.length) clearInterval(interval);
  }, 600);

  try {
    const res  = await fetch('/api/predict', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    sessionStorage.setItem('vitacheck_result', JSON.stringify(data));
    setTimeout(() => { window.location.href = '/results'; }, 2800);
  } catch(e) {
    clearInterval(interval);
    overlay.classList.add('hidden');
    alert('Error: ' + e.message);
  }
}

buildSymptoms();
