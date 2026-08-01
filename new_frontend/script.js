/* =========================================================================
   AI LOAN APPROVAL SYSTEM — script.js
   Sections:
   1. Theme toggle (dark/light)
   2. Mobile nav toggle
   3. Scroll-reveal animations
   4. Animated stat counters
   5. Ripple effect on buttons
   6. Floating label state (filled/empty)
   7. Form validation
   8. Confetti effect
   9. Risk band + recommendation, derived from the model's real confidence
      score returned by the API (the score itself is not invented client-side)
   10. Prediction submission (Fetch API -> FastAPI backend)
   11. Dashboard charts (Chart.js)
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. THEME TOGGLE
   State is kept in memory only (no localStorage — this file is meant to be
   dropped into any host, and some hosts disallow persistent storage).
   Initial theme follows the OS/browser preference.
   ------------------------------------------------------------------------- */
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(prefersDark ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

/* -------------------------------------------------------------------------
   2. MOBILE NAV TOGGLE
   ------------------------------------------------------------------------- */
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

// Close the mobile menu after tapping a link.
siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* -------------------------------------------------------------------------
   3. SCROLL-REVEAL ANIMATIONS
   Any element with the `.reveal` class fades/slides in once it enters the
   viewport, using IntersectionObserver so it only fires once.
   ------------------------------------------------------------------------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* -------------------------------------------------------------------------
   4. ANIMATED STAT COUNTERS
   Counts each `.stat-value` up from 0 to its `data-count` target once it
   scrolls into view, using requestAnimationFrame for smooth easing.
   ------------------------------------------------------------------------- */
function animateCount(el) {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = Math.round(target * eased);
    el.textContent = `${prefix}${value.toLocaleString('en-IN')}${suffix}`;
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

document.querySelectorAll('.stat-value').forEach((el) => statObserver.observe(el));

/* -------------------------------------------------------------------------
   5. RIPPLE EFFECT
   Any element with `.ripple` gets a circular ink-splash on click, sized and
   positioned relative to the click point.
   ------------------------------------------------------------------------- */
document.querySelectorAll('.ripple').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const dot = document.createElement('span');
    dot.className = 'ripple-dot';
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${event.clientX - rect.left - size / 2}px`;
    dot.style.top = `${event.clientY - rect.top - size / 2}px`;
    btn.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  });
});

/* Hero "Predict Loan" button scrolls down to the form and focuses the first field. */
document.getElementById('heroPredictBtn').addEventListener('click', () => {
  document.getElementById('formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => document.getElementById('no_of_dependents').focus(), 500);
});

/* -------------------------------------------------------------------------
   6. FLOATING LABEL STATE
   Inputs/selects get a `.filled` class whenever they hold a value, so the
   label stays raised even when the field isn't focused (CSS handles the
   raised position/animation — this just tracks "has content").
   ------------------------------------------------------------------------- */
const FIELD_NAMES = [
  'no_of_dependents', 'education', 'self_employed', 'income_annum',
  'loan_amount', 'loan_term', 'cibil_score', 'residential_assets_value',
  'commercial_assets_value', 'luxury_assets_value', 'bank_asset_value'
];

function syncFilledState(input) {
  input.classList.toggle('filled', input.value.trim() !== '');
}

FIELD_NAMES.forEach((name) => {
  const input = document.getElementById(name);
  syncFilledState(input);
  input.addEventListener('input', () => syncFilledState(input));
  input.addEventListener('change', () => syncFilledState(input));
});

/* -------------------------------------------------------------------------
   7. FORM VALIDATION
   Same validation contract as the data the backend expects: every field
   required, numeric fields must be positive, CIBIL clamped to 300-900.
   ------------------------------------------------------------------------- */
const FIELD_RULES = {
  no_of_dependents: { type: 'number', min: 0, label: 'Number of dependents' },
  education: { type: 'select', label: 'Education' },
  self_employed: { type: 'select', label: 'Self employed status' },
  income_annum: { type: 'number', min: 0, exclusiveMin: true, label: 'Annual income' },
  loan_amount: { type: 'number', min: 0, exclusiveMin: true, label: 'Loan amount' },
  loan_term: { type: 'number', min: 0, exclusiveMin: true, label: 'Loan term' },
  cibil_score: { type: 'number', min: 300, max: 900, label: 'CIBIL score' },
  residential_assets_value: { type: 'number', min: 0, label: 'Residential assets value' },
  commercial_assets_value: { type: 'number', min: 0, label: 'Commercial assets value' },
  luxury_assets_value: { type: 'number', min: 0, label: 'Luxury assets value' },
  bank_asset_value: { type: 'number', min: 0, label: 'Bank asset value' }
};

function validateField(name, rawValue) {
  const rule = FIELD_RULES[name];
  const value = String(rawValue ?? '').trim();

  if (value === '') return `${rule.label} is required.`;
  if (rule.type === 'select') return '';

  const num = Number(value);
  if (Number.isNaN(num)) return `${rule.label} must be a valid number.`;
  if (num < 0) return `${rule.label} cannot be negative.`;
  if (rule.exclusiveMin && num <= 0) return `${rule.label} must be greater than 0.`;
  if (typeof rule.min === 'number' && num < rule.min) return `${rule.label} must be at least ${rule.min}.`;
  if (typeof rule.max === 'number' && num > rule.max) return `${rule.label} cannot exceed ${rule.max}.`;
  return '';
}

function setFieldError(name, message) {
  const input = document.getElementById(name);
  const errorEl = document.getElementById(`err_${name}`);
  const wrapper = input.closest('.field');

  errorEl.textContent = message;
  wrapper.classList.toggle('has-error', Boolean(message));
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function validateForm() {
  let isValid = true;
  let firstInvalid = null;

  Object.keys(FIELD_RULES).forEach((name) => {
    const input = document.getElementById(name);
    const message = validateField(name, input.value);
    setFieldError(name, message);
    if (message) {
      isValid = false;
      if (!firstInvalid) firstInvalid = input;
    }
  });

  if (firstInvalid) firstInvalid.focus();
  return isValid;
}

FIELD_NAMES.forEach((name) => {
  const input = document.getElementById(name);
  input.addEventListener('blur', () => setFieldError(name, validateField(name, input.value)));
  input.addEventListener('input', () => {
    if (input.closest('.field').classList.contains('has-error')) {
      setFieldError(name, validateField(name, input.value));
    }
  });
});

/* -------------------------------------------------------------------------
   8. CONFETTI EFFECT
   Lightweight canvas confetti burst, triggered only on an approved result.
   No external library required.
   ------------------------------------------------------------------------- */
function fireConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#22C55E', '#2563EB', '#F59E0B', '#EF4444', '#A855F7'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: rect.width / 2,
    y: 40,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * -6 - 2,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 12,
    gravity: 0.18
  }));

  let frame = 0;
  const maxFrames = 110;

  function tick() {
    frame += 1;
    ctx.clearRect(0, 0, rect.width, rect.height);
    pieces.forEach((p) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }
  requestAnimationFrame(tick);
}

/* -------------------------------------------------------------------------
   9. RISK BAND + RECOMMENDATION
   The FastAPI backend (controller.py -> ml_model.py) now returns a real
   confidence score from the trained model:
     { "status": "Approved" | "Rejected", "confidence": 0.0-1.0 }
   Confidence is no longer guessed on the client. This function only turns
   that real confidence into a risk label and a short suggestion — it does
   not alter the prediction itself.
   ------------------------------------------------------------------------- */
function deriveRiskAndRecommendation(status, confidencePercent) {
  const approved = status === 'Approved';

  let risk = 'Moderate';
  if (confidencePercent >= 85) risk = 'Low';
  else if (confidencePercent < 65) risk = 'High';

  let recommendation;
  if (approved) {
    recommendation = risk === 'Low'
      ? 'Strong profile \u2014 the model is highly confident in this approval. Keep your CIBIL score steady and avoid new large liabilities before disbursal.'
      : 'This application is likely to be approved, but the model\u2019s confidence is moderate. Maintaining your current CIBIL score and income stability will help.';
  } else {
    recommendation = risk === 'High'
      ? 'Consider improving your CIBIL score, reducing the requested loan amount, or adding a co-applicant to strengthen a future application.'
      : 'This application was close to the approval threshold. A slightly lower loan amount or a longer repayment term may improve the odds next time.';
  }

  return { risk, recommendation };
}

/* -------------------------------------------------------------------------
   10. PREDICTION SUBMISSION
   Backend contract (see main.py / controller.py / ml_model.py):
     POST /predict
     Request body:  the same 11 applicant fields collected below
     Response body: { "status": "Approved" | "Rejected", "confidence": 0.0-1.0 }

   NOTE: main.py does not add CORSMiddleware. If this page is served from
   a different origin/port than the API (e.g. opened as a file, or served
   by a live-reload tool on another port), the browser will block the
   request with a CORS error even though the server is reachable. Add to
   main.py if that happens:
     from fastapi.middleware.cors import CORSMiddleware
     app.add_middleware(CORSMiddleware, allow_origins=["*"],
                         allow_methods=["*"], allow_headers=["*"])
   ------------------------------------------------------------------------- */
const PREDICT_ENDPOINT = 'http://127.0.0.1:5000/predict';

const loanForm = document.getElementById('loanForm');
const predictBtn = document.getElementById('predictBtn');
const btnLabel = document.getElementById('btnLabel');
const btnSpinner = document.getElementById('btnSpinner');
const loadingState = document.getElementById('loadingState');

const resultSection = document.getElementById('resultSection');
const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const metricPrediction = document.getElementById('metricPrediction');
const metricConfidence = document.getElementById('metricConfidence');
const metricRisk = document.getElementById('metricRisk');
const recommendationText = document.getElementById('recommendationText');
const confettiCanvas = document.getElementById('confettiCanvas');
const tryAgainBtn = document.getElementById('tryAgainBtn');

function setLoading(isLoading) {
  predictBtn.disabled = isLoading;
  btnSpinner.hidden = !isLoading;
  btnLabel.textContent = isLoading ? 'Submitting…' : 'Predict Loan Status';
  loadingState.hidden = !isLoading;
}

function collectFormData() {
  return {
    no_of_dependents: Number(document.getElementById('no_of_dependents').value),
    education: document.getElementById('education').value,
    self_employed: document.getElementById('self_employed').value,
    income_annum: Number(document.getElementById('income_annum').value),
    loan_amount: Number(document.getElementById('loan_amount').value),
    loan_term: Number(document.getElementById('loan_term').value),
    cibil_score: Number(document.getElementById('cibil_score').value),
    residential_assets_value: Number(document.getElementById('residential_assets_value').value),
    commercial_assets_value: Number(document.getElementById('commercial_assets_value').value),
    luxury_assets_value: Number(document.getElementById('luxury_assets_value').value),
    bank_asset_value: Number(document.getElementById('bank_asset_value').value)
  };
}

const icons = {
  approved: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  rejected: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'error-state': '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5h.01" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2"/></svg>'
};

function showResult({ state, title, message, prediction, confidence, risk, recommendation }) {
  resultCard.className = `result-card ${state}`;
  resultIcon.innerHTML = icons[state];
  resultTitle.textContent = title;
  resultMessage.textContent = message;
  metricPrediction.textContent = prediction;
  metricConfidence.textContent = confidence;
  metricRisk.textContent = risk;
  recommendationText.textContent = recommendation;

  loanForm.closest('.form-card').hidden = true;
  document.querySelector('.split-left').hidden = true;
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (state === 'approved') {
    // Wait a frame so the canvas has real layout dimensions before drawing.
    requestAnimationFrame(() => fireConfetti(confettiCanvas));
  }
}

tryAgainBtn.addEventListener('click', () => {
  resultSection.hidden = true;
  loanForm.closest('.form-card').hidden = false;
  document.querySelector('.split-left').hidden = false;
  document.getElementById('formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

loanForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!validateForm()) return;

  const payload = collectFormData();
  setLoading(true);

  try {
    const response = await fetch(PREDICT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // FastAPI's /predict raises HTTPException(400) on prediction failure,
      // with the reason in `detail`.
      let detail = `Server responded with ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.detail) detail = errBody.detail;
      } catch (_) { /* response wasn't JSON; keep the generic message */ }
      throw new Error(detail);
    }

    const data = await response.json();

    // Backend contract: { status: "Approved" | "Rejected", confidence: 0.0-1.0 }
    const confidencePercent = Math.round(Number(data.confidence) * 100);

    if (data.status === 'Approved') {
      const { risk, recommendation } = deriveRiskAndRecommendation(data.status, confidencePercent);
      showResult({
        state: 'approved',
        title: 'Loan Approved',
        message: 'Congratulations! Your loan is likely to be approved.',
        prediction: 'Approved',
        confidence: `${confidencePercent}%`,
        risk,
        recommendation
      });
    } else if (data.status === 'Rejected') {
      const { risk, recommendation } = deriveRiskAndRecommendation(data.status, confidencePercent);
      showResult({
        state: 'rejected',
        title: 'Loan Rejected',
        message: 'Your application does not currently meet the approval criteria.',
        prediction: 'Rejected',
        confidence: `${confidencePercent}%`,
        risk,
        recommendation
      });
    } else {
      showResult({
        state: 'error-state',
        title: 'Unexpected Response',
        message: 'The prediction service returned an unrecognised result.',
        prediction: '—',
        confidence: '—',
        risk: '—',
        recommendation: 'Please try submitting the form again.'
      });
    }
  } catch (err) {
    showResult({
      state: 'error-state',
      title: 'Couldn\u2019t Reach the Prediction Service',
      message: `Make sure the FastAPI server is running at ${PREDICT_ENDPOINT} (uvicorn main:app --reload). ${err.message ? `Details: ${err.message}` : ''}`,
      prediction: '—',
      confidence: '—',
      risk: '—',
      recommendation: 'Start the backend server and try again.'
    });
    console.error('Loan prediction request failed:', err);
  } finally {
    setLoading(false);
  }
});

/* -------------------------------------------------------------------------
   11. DASHBOARD CHARTS (Chart.js)
   Illustrative portfolio-level charts. These use static sample data since
   the backend contract only returns a single prediction, not aggregate
   analytics — swap `datasets` for real data if/when such an endpoint
   exists.
   ------------------------------------------------------------------------- */
const isDark = () => root.getAttribute('data-theme') === 'dark';
const gridColor = () => (isDark() ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)');
const textColor = () => (isDark() ? '#B0BAC9' : '#475569');

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = textColor();

new Chart(document.getElementById('chartLoanDistribution'), {
  type: 'doughnut',
  data: {
    labels: ['Approved', 'Rejected'],
    datasets: [{ data: [68, 32], backgroundColor: ['#22C55E', '#EF4444'], borderWidth: 0 }]
  },
  options: {
    responsive: true,
    animation: { animateScale: true, animateRotate: true, duration: 900 },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16 } } }
  }
});

new Chart(document.getElementById('chartCibilDistribution'), {
  type: 'bar',
  data: {
    labels: ['300-500', '500-650', '650-750', '750-850', '850-900'],
    datasets: [{ label: 'Applicants', data: [8, 22, 40, 26, 12], backgroundColor: '#2563EB', borderRadius: 6 }]
  },
  options: {
    responsive: true,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: gridColor() }, beginAtZero: true }
    }
  }
});

new Chart(document.getElementById('chartIncomeVsLoan'), {
  type: 'scatter',
  data: {
    datasets: [{
      label: 'Applicants',
      data: Array.from({ length: 40 }, () => ({
        x: Math.round(200000 + Math.random() * 900000),
        y: Math.round(500000 + Math.random() * 3500000)
      })),
      backgroundColor: '#2563EB'
    }]
  },
  options: {
    responsive: true,
    animation: { duration: 900 },
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Annual income (₹)' }, grid: { color: gridColor() } },
      y: { title: { display: true, text: 'Loan amount (₹)' }, grid: { color: gridColor() } }
    }
  }
});

new Chart(document.getElementById('chartAssetBreakdown'), {
  type: 'pie',
  data: {
    labels: ['Residential', 'Commercial', 'Luxury', 'Bank'],
    datasets: [{
      data: [42, 21, 15, 22],
      backgroundColor: ['#2563EB', '#22C55E', '#F59E0B', '#A855F7'],
      borderWidth: 0
    }]
  },
  options: {
    responsive: true,
    animation: { animateScale: true, animateRotate: true, duration: 900 },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16 } } }
  }
});