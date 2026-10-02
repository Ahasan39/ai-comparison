(function () {
  'use strict';

  // Calculate resting energy needs using the Mifflin-St Jeor formula.
  function calculateBmr(weight, height, age, sex) {
    return 10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161);
  }

  // Map daily steps to the specified activity multiplier.
  function activityMultiplier(steps) {
    if (steps < 5000) return 1.2;
    if (steps < 7500) return 1.375;
    if (steps < 10000) return 1.5;
    if (steps < 12500) return 1.65;
    return 1.8;
  }

  // Calculate daily water in milliliters from weight and complete step blocks.
  function calculateWater(weight, steps) {
    return weight * 35 + Math.floor(Math.max(0, steps - 5000) / 5000) * 350;
  }

  // Calculate all daily targets and the signed weekly change at full precision.
  function calculateTargets(weight, height, age, sex, steps, goal) {
    const bmr = calculateBmr(weight, height, age, sex);
    const tdee = bmr * activityMultiplier(steps);
    const calories = tdee * (goal === 'loss' ? 0.8 : goal === 'gain' ? 1.1 : 1);
    const protein = weight * (goal === 'maintain' ? 1.4 : 1.8);
    const fat = calories * 0.25 / 9;
    const carbs = (calories - protein * 4 - fat * 9) / 4;
    const weeklyChange = (calories - tdee) * 7 / 7700;
    return {
      calories, protein, fat, carbs,
      water: calculateWater(weight, steps) / 1000,
      steps: Math.min(steps * 1.15, 15000),
      weeklyChange,
      weeksPerKg: weeklyChange === 0 ? null : 1 / Math.abs(weeklyChange)
    };
  }

  function initializeCalculator() {
    const form = document.getElementById('target-form');
    const fields = Array.from(form.querySelectorAll('input, select'));
    const results = document.getElementById('results');
    const announcement = document.getElementById('announcement');
    const summary = document.getElementById('summary');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
    const twoDecimals = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const oneDecimal = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const allowedOptions = { sex: ['male', 'female'], goal: ['loss', 'maintain', 'gain'] };
    const fieldNames = { weight: 'weight', age: 'age', height: 'height', steps: 'average daily steps' };
    let revision = 0;

    function hideResults() {
      revision += 1;
      results.hidden = true;
      results.classList.remove('is-visible');
      announcement.textContent = '';
    }

    function validateField(field) {
      field.setCustomValidity('');
      let message = '';
      const validity = field.validity;
      if (field.tagName === 'SELECT') {
        if (!allowedOptions[field.id].includes(field.value)) {
          message = field.id === 'sex' ? 'Please select Male or Female.' : 'Please select one of the listed goals.';
        }
      } else if (validity.badInput) {
        message = 'Enter a valid number for ' + fieldNames[field.id] + '.';
      } else if (validity.valueMissing) {
        message = 'Enter your ' + fieldNames[field.id] + '.';
      } else if (validity.rangeUnderflow || validity.rangeOverflow) {
        message = 'Enter ' + fieldNames[field.id] + ' between ' + whole.format(Number(field.min)) + ' and ' + whole.format(Number(field.max)) + '.';
      } else if (validity.stepMismatch) {
        message = field.step === '1' ? 'Enter a whole number for ' + fieldNames[field.id] + '.' : 'Use increments of 0.1 for ' + fieldNames[field.id] + '.';
      } else if (!Number.isFinite(field.valueAsNumber)) {
        message = 'Enter a valid number for ' + fieldNames[field.id] + '.';
      }
      field.setCustomValidity(message);
      const error = document.getElementById(field.id + '-error');
      error.textContent = message;
      error.hidden = !message;
      if (message) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      return !message;
    }

    form.addEventListener('invalid', function (event) {
      if (fields.includes(event.target)) {
        hideResults();
        validateField(event.target);
      }
    }, true);

    fields.forEach(function (field) {
      function handleEdit() {
        hideResults();
        validateField(field);
      }
      field.addEventListener('input', handleEdit);
      field.addEventListener('change', handleEdit);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      hideResults();
      const validFields = fields.map(validateField);
      if (validFields.includes(false) || !form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const values = form.elements;
      const targets = calculateTargets(
        values.weight.valueAsNumber, values.height.valueAsNumber,
        values.age.valueAsNumber, values.sex.value,
        values.steps.valueAsNumber, values.goal.value
      );
      ['calories', 'protein', 'carbs', 'fat', 'steps'].forEach(function (key) {
        document.getElementById(key + '-result').textContent = whole.format(Math.round(targets[key]));
      });
      document.getElementById('water-result').textContent = twoDecimals.format(targets.water);
      if (targets.weeklyChange === 0) {
        summary.textContent = 'Estimated weight maintenance';
      } else {
        const losing = targets.weeklyChange < 0;
        summary.textContent = 'Approximately ' + twoDecimals.format(Math.abs(targets.weeklyChange)) +
          ' kg ' + (losing ? 'loss' : 'gain') + ' per week and ' +
          oneDecimal.format(targets.weeksPerKg) + ' weeks to ' + (losing ? 'lose' : 'gain') + ' 1 kg.';
      }
      results.hidden = false;
      const currentRevision = revision;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (currentRevision !== revision) return;
          results.classList.add('is-visible');
          announcement.textContent = 'Your approximate daily targets are ready below the form. ' +
            whole.format(Math.round(targets.calories)) + ' calories per day. ' + summary.textContent;
        });
      });
    });

    document.getElementById('recalculate').addEventListener('click', function () {
      document.getElementById('weight').focus({ preventScroll: true });
      form.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    });
  }

  initializeCalculator();
}());
