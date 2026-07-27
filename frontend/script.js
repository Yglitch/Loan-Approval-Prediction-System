/* =========================================================================
   LoanIQ — script.js
   Handles: form validation, live CIBIL gauge, submission to the prediction
   API, loading state, and result rendering.
   ========================================================================= */

// ---- Cache DOM references once, up front ---------------------------------
const form          = document.getElementById('loanForm');
const formView       = document.getElementById('formView');
const resultView      = document.getElementById('resultView');
const resultCard      = document.getElementById('resultCard');
const resultIcon      = document.getElementById('resultIcon');
const resultTitle     = document.getElementById('resultTitle');
const resultSubtitle  = document.getElementById('resultSubtitle');
const tryAgainBtn     = document.getElementById('tryAgainBtn');

const predictBtn  = document.getElementById('predictBtn');
const btnSpinner   = document.getElementById('btnSpinner');
const btnLabel     = predictBtn.querySelector('.btn-label');

const cibilInput  = document.getElementById('cibil_score');
const gaugeFill    = document.getElementById('gaugeFill');
const gaugeValue   = document.getElementById('gaugeValue');
const gaugeLabel   = document.getElementById('gaugeLabel');

// The endpoint where the trained Python model is served.
const PREDICT_ENDPOINT = 'http://127.0.0.1:5000/predict';

// Total length (in px) of the semicircular gauge arc, pre-measured from the
// SVG path (`M20 110 A80 80 0 0 1 180 110`, radius 80 → π·r ≈ 251.3).
const GAUGE_ARC_LENGTH = 251.3;

/* =========================================================================
   Field configuration
   Each entry describes how a given input should be validated. Centralising
   this makes it easy to add/remove fields without touching the validation
   logic itself.
   ========================================================================= */
const FIELD_RULES = {
  no_of_dependents: {
    type: 'number',
    min: 0,
    label: 'Number of dependents'
  },
  education: {
    type: 'select',
    label: 'Education'
  },
  self_employed: {
    type: 'select',
    label: 'Self employed status'
  },
  income_annum: {
    type: 'number',
    min: 0,
    exclusiveMin: true, // must be strictly greater than 0
    label: 'Annual income'
  },
  loan_amount: {
    type: 'number',
    min: 0,
    exclusiveMin: true,
    label: 'Loan amount'
  },
  loan_term: {
    type: 'number',
    min: 0,
    exclusiveMin: true,
    label: 'Loan term'
  },
  cibil_score: {
    type: 'number',
    min: 300,
    max: 900,
    label: 'CIBIL score'
  },
  residential_assets_value: {
    type: 'number',
    min: 0,
    label: 'Residential assets value'
  },
  commercial_assets_value: {
    type: 'number',
    min: 0,
    label: 'Commercial assets value'
  },
  luxury_assets_value: {
    type: 'number',
    min: 0,
    label: 'Luxury assets value'
  },
  bank_asset_value: {
    type: 'number',
    min: 0,
    label: 'Bank asset value'
  }
};

/* =========================================================================
   Validation helpers
   ========================================================================= */

/**
 * Validates a single field against its configured rule.
 * Returns an empty string when valid, or a human-readable error otherwise.
 */
function validateField(name, rawValue) {
  const rule = FIELD_RULES[name];
  const value = String(rawValue ?? '').trim();

  // 1. Required check — applies to every field.
  if (value === '') {
    return `${rule.label} is required.`;
  }

  // 2. Dropdown fields only need the "required" check above.
  if (rule.type === 'select') {
    return '';
  }

  // 3. Numeric fields must actually be numbers.
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return `${rule.label} must be a valid number.`;
  }

  // 4. Numeric fields must be positive (no negative loan amounts, incomes, etc.)
  if (numericValue < 0) {
    return `${rule.label} cannot be negative.`;
  }

  // 5. Some fields (income, loan amount, loan term) must be greater than zero.
  if (rule.exclusiveMin && numericValue <= 0) {
    return `${rule.label} must be greater than 0.`;
  }

  // 6. Explicit min/max bounds (used for CIBIL score: 300–900).
  if (typeof rule.min === 'number' && numericValue < rule.min) {
    return `${rule.label} must be at least ${rule.min}.`;
  }
  if (typeof rule.max === 'number' && numericValue > rule.max) {
    return `${rule.label} cannot exceed ${rule.max}.`;
  }

  return '';
}

/**
 * Renders (or clears) the error message for a single field, and toggles
 * the `.has-error` styling class on its parent `.field` wrapper.
 */
function setFieldError(name, message) {
  const input = document.getElementById(name);
  const errorEl = document.getElementById(`err_${name}`);
  const wrapper = input.closest('.field');

  errorEl.textContent = message;

  if (message) {
    wrapper.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
  } else {
    wrapper.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
  }
}

/**
 * Validates every field in the form.
 * Returns true if the whole form is valid, false otherwise.
 * As a side effect, displays/clears each field's inline error message.
 */
function validateForm() {
  let isFormValid = true;
  let firstInvalidField = null;

  Object.keys(FIELD_RULES).forEach((name) => {
    const input = document.getElementById(name);
    const message = validateField(name, input.value);

    setFieldError(name, message);

    if (message) {
      isFormValid = false;
      if (!firstInvalidField) firstInvalidField = input;
    }
  });

  // Move focus to the first invalid field so users (and screen readers)
  // immediately know what needs fixing.
  if (firstInvalidField) {
    firstInvalidField.focus({ preventScroll: false });
  }

  return isFormValid;
}

// Validate a field as soon as the user leaves it, and re-validate on every
// keystroke once an error is already showing (so it clears the moment the
// user fixes it, rather than waiting for the next blur).
Object.keys(FIELD_RULES).forEach((name) => {
  const input = document.getElementById(name);

  input.addEventListener('blur', () => {
    setFieldError(name, validateField(name, input.value));
  });

  input.addEventListener('input', () => {
    const wrapper = input.closest('.field');
    if (wrapper.classList.contains('has-error')) {
      setFieldError(name, validateField(name, input.value));
    }
  });
});

/* =========================================================================
   Live CIBIL gauge
   Draws a filled arc + numeric readout that updates as the user types,
   giving instant visual feedback on where their score sits.
   ========================================================================= */
function updateGauge() {
  const raw = cibilInput.value.trim();

  if (raw === '') {
    gaugeFill.style.strokeDashoffset = GAUGE_ARC_LENGTH;
    gaugeValue.textContent = '—';
    gaugeLabel.textContent = 'enter score';
    gaugeFill.style.stroke = 'var(--gold)';
    return;
  }

  const score = Number(raw);

  // Clamp for drawing purposes only — validation errors still surface below.
  const clamped = Math.min(900, Math.max(300, Number.isNaN(score) ? 300 : score));
  const fraction = (clamped - 300) / (900 - 300);
  const offset = GAUGE_ARC_LENGTH * (1 - fraction);

  gaugeFill.style.strokeDashoffset = offset;
  gaugeValue.textContent = Number.isNaN(score) ? '—' : score;

  // Colour + descriptive label by risk band.
  if (clamped < 650) {
    gaugeFill.style.stroke = '#E07A6E';
    gaugeLabel.textContent = 'needs work';
  } else if (clamped < 750) {
    gaugeFill.style.stroke = 'var(--gold)';
    gaugeLabel.textContent = 'fair';
  } else {
    gaugeFill.style.stroke = '#5FCB9A';
    gaugeLabel.textContent = 'strong';
  }
}

cibilInput.addEventListener('input', updateGauge);
updateGauge(); // initialise the gauge in its empty state

/* =========================================================================
   Submission flow
   ========================================================================= */

/** Switches the visible button state between "idle" and "loading". */
function setLoading(isLoading) {
  predictBtn.disabled = isLoading;
  btnSpinner.hidden = !isLoading;
  btnLabel.textContent = isLoading ? 'Analyzing application…' : 'Predict Loan Status';
}

/** Builds the JSON payload from current form values, cast to correct types. */
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

/** Renders the outcome (approved / rejected / error) into the result card. */
function showResult(state, title, subtitle) {
  // state is one of: 'approved' | 'rejected' | 'error-state'
  resultCard.className = `result-card ${state}`;

  const icons = {
    approved: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rejected: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'error-state': '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5h.01" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2"/></svg>'
  };

  resultIcon.innerHTML = icons[state];
  resultTitle.textContent = title;
  resultSubtitle.textContent = subtitle;

  formView.hidden = true;
  resultView.hidden = false;
}

/** Returns the UI to the editable form, hiding the result card. */
function resetToForm() {
  resultView.hidden = true;
  formView.hidden = false;
}

tryAgainBtn.addEventListener('click', resetToForm);

// Main submit handler.
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // never let the browser do a full page reload

  const isValid = validateForm();
  if (!isValid) return; // inline errors are already visible; stop here

  const payload = collectFormData();
  setLoading(true);

  try {
    const response = await fetch(PREDICT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data.loan_status === 'Approved') {
      showResult(
        'approved',
        'Loan Approved',
        'Based on the details provided, this application meets the model\u2019s approval criteria.'
      );
    } else if (data.loan_status === 'Rejected') {
      showResult(
        'rejected',
        'Loan Rejected',
        'Based on the details provided, this application does not currently meet the approval criteria.'
      );
    } else {
      // The backend responded, but not with a recognised status value.
      showResult(
        'error-state',
        'Unexpected Response',
        'The prediction service returned an unrecognised result. Please try again.'
      );
    }
  } catch (err) {
    // Typically a network failure — e.g. the Flask/Python server at
    // 127.0.0.1:5000 isn't running or isn't reachable from the browser.
    showResult(
      'error-state',
      'Couldn\u2019t Reach the Prediction Service',
      'Make sure the backend server is running at http://127.0.0.1:5000 and try again.'
    );
    console.error('LoanIQ prediction request failed:', err);
  } finally {
    setLoading(false);
  }
});
