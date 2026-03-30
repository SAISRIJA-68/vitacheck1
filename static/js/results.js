// results.js — Dashboard rendering + PDF export

const data = (() => {
  try { return JSON.parse(sessionStorage.getItem('vitacheck_result')); }
  catch { return null; }
})();

if (!data) {
  document.getElementById('resultsWrap').classList.add('hidden');
  document.getElementById('noData').classList.remove('hidden');
} else {
  renderDashboard(data);
}

function renderDashboard(d) {
  // ── Diagnosis ──────────────────────────────────────────────
  document.getElementById('diagnosisTitle').textContent = d.disease;
  const confFill = document.getElementById('confFill');
  const confPct  = document.getElementById('confPct');
  setTimeout(() => { confFill.style.width = d.confidence + '%'; }, 200);
  confPct.textContent = d.confidence + '%';
  document.getElementById('supplementsBox').textContent = '💊 ' + d.supplements;

  // ── Health Score ring ──────────────────────────────────────
  const circle = document.getElementById('scoreCircle');
  const numEl  = document.getElementById('scoreNumber');
  const total  = 376.99;
  const offset = total - (total * d.health_score / 100);
  setTimeout(() => { circle.style.strokeDashoffset = offset; }, 300);
  animateNumber(numEl, 0, d.health_score, 1500);
  document.getElementById('scoreLabel').textContent =
    d.health_score >= 70 ? 'Good Health' : d.health_score >= 45 ? 'Moderate Health' : 'Needs Attention';

  // ── Severity ───────────────────────────────────────────────
  const sev = d.severity;
  const badge = document.getElementById('sevBadge');
  badge.textContent = sev.label;
  badge.style.color = sev.color;
  setTimeout(() => {
    document.getElementById('gaugeFill').style.left = sev.score + '%';
  }, 400);
  document.getElementById('symptomSummary').textContent =
    `${d.symptom_count} of ${d.total_symptoms} symptoms reported`;

  // ── Food pills ─────────────────────────────────────────────
  const fp = document.getElementById('foodPills');
  const FOOD_ICONS = ['🥕','🥦','🐟','🥚','🥛','🥗','🍊','🫘','🥩','🍠','🫚'];
  d.foods.forEach((f, i) => {
    const p = document.createElement('div');
    p.className = 'food-pill';
    p.textContent = (FOOD_ICONS[i % FOOD_ICONS.length]) + ' ' + f;
    fp.appendChild(p);
  });

  // ── Diet plan ──────────────────────────────────────────────
  const mt = document.getElementById('mealTimeline');
  const mealMeta = {
    morning: { icon:'🌅', label:'Morning' },
    lunch:   { icon:'☀️',  label:'Lunch'   },
    evening: { icon:'🌤️', label:'Evening' },
    dinner:  { icon:'🌙', label:'Dinner'  },
  };
  Object.entries(d.diet_plan).forEach(([key, val]) => {
    const m = mealMeta[key] || { icon:'🍽️', label: key };
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.innerHTML = `<div class="meal-time">${m.icon} ${m.label}</div><div class="meal-desc">${val}</div>`;
    mt.appendChild(card);
  });

  // ── Lifestyle ──────────────────────────────────────────────
  const ll = document.getElementById('lifestyleList');
  d.lifestyle.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    ll.appendChild(li);
  });

  // ── All probs ──────────────────────────────────────────────
  const pl = document.getElementById('probList');
  d.all_probs.forEach(item => {
    const row = document.createElement('div');
    row.className = 'prob-row';
    row.innerHTML = `
      <div class="prob-label-row">
        <span class="prob-label">${item.disease}</span>
        <span class="prob-pct">${item.prob}%</span>
      </div>
      <div class="prob-track"><div class="prob-bar" style="width:0%" data-w="${item.prob}"></div></div>
    `;
    pl.appendChild(row);
  });
  setTimeout(() => {
    document.querySelectorAll('.prob-bar').forEach(b => {
      b.style.width = b.dataset.w + '%';
    });
  }, 400);

  // ── Charts ─────────────────────────────────────────────────
  const isDark = document.body.getAttribute('data-theme') !== 'light';
  const textCol  = isDark ? '#8899bb' : '#556080';
  const gridCol  = isDark ? 'rgba(99,130,220,.1)' : 'rgba(99,130,220,.15)';

  const chartDefaults = {
    responsive: true,
    plugins: { legend: { labels: { color: textCol, font:{ family:'DM Sans' } } } },
    scales: {
      x: { ticks:{ color: textCol }, grid:{ color: gridCol } },
      y: { ticks:{ color: textCol }, grid:{ color: gridCol } },
    }
  };

  // Model comparison bar chart
  const mcLabels = Object.keys(d.model_comparison);
  const mcData   = Object.values(d.model_comparison).map(v => (v * 100).toFixed(1));
  new Chart(document.getElementById('modelChart'), {
    type: 'bar',
    data: {
      labels: mcLabels,
      datasets: [{
        label: 'Accuracy %',
        data: mcData,
        backgroundColor: ['rgba(110,231,183,.7)','rgba(59,130,246,.7)','rgba(167,139,250,.7)','rgba(245,158,11,.7)'],
        borderRadius: 8,
      }]
    },
    options: { ...chartDefaults, plugins:{ legend:{ display:false } }, scales:{ y:{ min:0,max:100, ticks:{color:textCol}, grid:{color:gridCol} }, x:{ ticks:{color:textCol}, grid:{color:gridCol} } } }
  });

  // Deficiency probability doughnut
  new Chart(document.getElementById('probChart'), {
    type: 'doughnut',
    data: {
      labels: d.all_probs.map(p => p.disease.replace(' Deficiency','').replace(' Anemia','')),
      datasets: [{
        data: d.all_probs.map(p => p.prob),
        backgroundColor: ['#6ee7b7','#3b82f6','#a78bfa','#f59e0b','#ef4444','#22c55e'],
        borderWidth: 2,
        borderColor: isDark ? '#1a2035' : '#fff',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position:'right', labels:{ color: textCol, font:{family:'DM Sans'}, boxWidth:12, padding:8 } }
      }
    }
  });

  // Feature importance bar
  const fi  = d.feature_importances;
  const fiS = Object.entries(fi).sort((a,b) => b[1]-a[1]).slice(0,8);
  new Chart(document.getElementById('featChart'), {
    type: 'bar',
    data: {
      labels: fiS.map(([k]) => k.replace(/_/g,' ')),
      datasets: [{
        label: 'Importance',
        data: fiS.map(([,v]) => (v*100).toFixed(2)),
        backgroundColor: 'rgba(59,130,246,.7)',
        borderRadius: 6,
      }]
    },
    options: {
      ...chartDefaults,
      indexAxis:'y',
      plugins:{ legend:{ display:false } },
      scales:{
        x:{ ticks:{color:textCol}, grid:{color:gridCol} },
        y:{ ticks:{color:textCol, font:{size:10}}, grid:{color:gridCol} }
      }
    }
  });
}

// ── Animate number ─────────────────────────────────────────────
function animateNumber(el, start, end, duration) {
  const diff  = end - start;
  const step  = diff / (duration / 16);
  let cur = start;
  const t = setInterval(() => {
    cur = Math.min(cur + step, end);
    el.textContent = Math.round(cur);
    if (cur >= end) clearInterval(t);
  }, 16);
}

// ── Reset ──────────────────────────────────────────────────────
function resetForm() {
  sessionStorage.removeItem('vitacheck_result');
  window.location.href = '/predict-page';
}

// ── PDF Report download ────────────────────────────────────────
function downloadReport() {
  if (!data) return;
  const d = data;

  const lines = [];
  lines.push('VITACHECK — HEALTH REPORT');
  lines.push('Generated: ' + new Date().toLocaleString());
  lines.push('='.repeat(50));
  lines.push('');
  lines.push('DIAGNOSIS: ' + d.disease);
  lines.push('Confidence: ' + d.confidence + '%');
  lines.push('Health Score: ' + d.health_score + ' / 100');
  lines.push('Severity: ' + d.severity.label + ' (' + d.severity.score + '%)');
  lines.push('Symptoms reported: ' + d.symptom_count + ' / ' + d.total_symptoms);
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push('SUPPLEMENTS RECOMMENDATION:');
  lines.push(d.supplements);
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push('RECOMMENDED FOODS:');
  lines.push(d.foods.join(', '));
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push('DAILY DIET PLAN:');
  Object.entries(d.diet_plan).forEach(([meal, desc]) => {
    lines.push(meal.toUpperCase() + ':');
    lines.push('  ' + desc);
  });
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push('LIFESTYLE SUGGESTIONS:');
  d.lifestyle.forEach((tip, i) => lines.push((i+1) + '. ' + tip));
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push('ALL PREDICTIONS:');
  d.all_probs.forEach(p => lines.push('  ' + p.disease + ': ' + p.prob + '%'));
  lines.push('');
  lines.push('─'.repeat(50));
  lines.push('DISCLAIMER: This report is for informational purposes only.');
  lines.push('Please consult a qualified healthcare professional for medical advice.');

  const blob = new Blob([lines.join('\n')], { type:'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'VitaCheck_Report_' + Date.now() + '.txt';
  a.click();
  URL.revokeObjectURL(url);
}
