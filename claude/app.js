(function () {
    'use strict';

    // Compute Basal Metabolic Rate with the Mifflin-St Jeor equation.
    function computeBmr(weightKg, heightCm, age, sex) {
        var base = 10 * weightKg + 6.25 * heightCm - 5 * age;
        return sex === 'male' ? base + 5 : base - 161;
    }

    // Map average daily steps to a TDEE activity multiplier.
    function activityMultiplier(dailySteps) {
        if (dailySteps < 5000) return 1.2;
        if (dailySteps < 7500) return 1.375;
        if (dailySteps < 10000) return 1.5;
        if (dailySteps < 12500) return 1.65;
        return 1.8;
    }

    // Compute Total Daily Energy Expenditure from BMR and activity multiplier.
    function computeTdee(bmr, multiplier) {
        return bmr * multiplier;
    }

    // Return the daily calorie target for the chosen goal.
    function computeCalorieTarget(tdee, goal) {
        if (goal === 'fatloss') return tdee * 0.8;
        if (goal === 'gain') return tdee * 1.1;
        return tdee;
    }

    // Return daily protein grams based on body weight and goal.
    function computeProteinGrams(weightKg, goal) {
        return goal === 'maintain' ? weightKg * 1.4 : weightKg * 1.8;
    }

    // Return daily fat grams as 25% of calorie target divided by 9 kcal/g.
    function computeFatGrams(calorieTarget) {
        return (calorieTarget * 0.25) / 9;
    }

    // Return daily carb grams as the remaining calories after protein and fat.
    function computeCarbGrams(calorieTarget, proteinGrams, fatGrams) {
        return (calorieTarget - proteinGrams * 4 - fatGrams * 9) / 4;
    }

    // Return daily water in milliliters: base per kg plus 350 ml per complete 5000-step block above 5000.
    function computeWaterMl(weightKg, dailySteps) {
        var extraBlocks = Math.floor(Math.max(0, dailySteps - 5000) / 5000);
        return weightKg * 35 + extraBlocks * 350;
    }

    // Return the daily step target, scaled 15% up and capped at 15000.
    function computeStepTarget(dailySteps) {
        return Math.min(dailySteps * 1.15, 15000);
    }

    // Return signed estimated weekly weight change in kilograms from the calorie deficit/surplus.
    function computeWeeklyWeightChangeKg(calorieTarget, tdee) {
        return ((calorieTarget - tdee) * 7) / 7700;
    }

    // Return rough weeks required to shift 1 kg given a non-zero weekly change.
    function computeWeeksPerKg(weeklyWeightChangeKg) {
        return 1 / Math.abs(weeklyWeightChangeKg);
    }

    // Produce the full set of displayable targets from validated raw inputs.
    function computeTargets(inputs) {
        var bmr = computeBmr(inputs.weightKg, inputs.heightCm, inputs.age, inputs.sex);
        var multiplier = activityMultiplier(inputs.dailySteps);
        var tdee = computeTdee(bmr, multiplier);
        var calorieTarget = computeCalorieTarget(tdee, inputs.goal);
        var proteinGrams = computeProteinGrams(inputs.weightKg, inputs.goal);
        var fatGrams = computeFatGrams(calorieTarget);
        var carbGrams = computeCarbGrams(calorieTarget, proteinGrams, fatGrams);
        var waterMl = computeWaterMl(inputs.weightKg, inputs.dailySteps);
        var stepTarget = computeStepTarget(inputs.dailySteps);
        var weeklyChange = computeWeeklyWeightChangeKg(calorieTarget, tdee);

        return {
            calorieTarget: calorieTarget,
            proteinGrams: proteinGrams,
            fatGrams: fatGrams,
            carbGrams: carbGrams,
            waterMl: waterMl,
            stepTarget: stepTarget,
            weeklyWeightChangeKg: weeklyChange,
            goal: inputs.goal
        };
    }

    // Return a strict integer parsed from the string, or null if it isn't a whole number.
    function parseStrictInteger(raw) {
        if (typeof raw !== 'string') return null;
        var trimmed = raw.trim();
        if (!/^-?\d+$/.test(trimmed)) return null;
        var n = Number(trimmed);
        return Number.isFinite(n) ? n : null;
    }

    // Return a strict decimal parsed from the string, or null if it has stray characters.
    function parseStrictDecimal(raw) {
        if (typeof raw !== 'string') return null;
        var trimmed = raw.trim();
        if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
        var n = Number(trimmed);
        return Number.isFinite(n) ? n : null;
    }

    // Format a whole-number result with locale-aware thousands separators.
    function formatWholeNumber(value) {
        return Math.round(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
    }

    // Format water from milliliters to liters with two decimal places.
    function formatLiters(ml) {
        return (ml / 1000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Format kilograms with two decimal places and no sign.
    function formatKgTwoDecimals(absKg) {
        return absKg.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Format a number with exactly one decimal place.
    function formatOneDecimal(value) {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
    }

    // Produce the human-readable weekly-change-and-timeline summary line.
    function buildSummary(weeklyChangeKg, goal) {
        if (goal === 'maintain' || weeklyChangeKg === 0) {
            return 'Estimated weight maintenance.';
        }
        var direction = weeklyChangeKg < 0 ? 'loss' : 'gain';
        var absKg = Math.abs(weeklyChangeKg);
        var weeks = 1 / absKg;
        return 'Approximately ' + formatKgTwoDecimals(absKg) + ' kg ' + direction +
            ' per week, and roughly ' + formatOneDecimal(weeks) + ' weeks to ' +
            (direction === 'loss' ? 'lose' : 'gain') + ' 1 kg. All estimates are approximate.';
    }

    function initCalculator() {
        var form = document.getElementById('calc-form');
        var results = document.getElementById('results');
        var announcer = document.getElementById('results-announcer');
        var recalcButton = document.getElementById('recalculate');

        var weightEl = document.getElementById('weight');
        var ageEl = document.getElementById('age');
        var sexEl = document.getElementById('sex');
        var heightEl = document.getElementById('height');
        var stepsEl = document.getElementById('steps');
        var goalEl = document.getElementById('goal');

        var outCalories = document.getElementById('r-calories');
        var outProtein = document.getElementById('r-protein');
        var outCarbs = document.getElementById('r-carbs');
        var outFat = document.getElementById('r-fat');
        var outWater = document.getElementById('r-water');
        var outSteps = document.getElementById('r-steps');
        var outSummary = document.getElementById('r-summary');

        var ALLOWED_SEX = ['male', 'female'];
        var ALLOWED_GOAL = ['fatloss', 'maintain', 'gain'];

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        function reducedMotion() {
            return prefersReducedMotion && prefersReducedMotion.matches;
        }

        function setFieldError(el, message) {
            var errorId = el.getAttribute('aria-describedby');
            // aria-describedby can list multiple ids; the error id is always the one ending in "-error".
            var ids = (errorId || '').split(/\s+/);
            var errorEl = null;
            for (var i = 0; i < ids.length; i++) {
                if (ids[i].slice(-6) === '-error') {
                    errorEl = document.getElementById(ids[i]);
                    break;
                }
            }
            if (!errorEl) return;
            if (message) {
                errorEl.textContent = message;
                el.setAttribute('aria-invalid', 'true');
            } else {
                errorEl.textContent = '';
                el.removeAttribute('aria-invalid');
            }
        }

        function clearAllErrors() {
            [weightEl, ageEl, sexEl, heightEl, stepsEl, goalEl].forEach(function (el) {
                setFieldError(el, '');
            });
        }

        function describeNumberError(el, kind) {
            var raw = el.value;
            var trimmed = (raw || '').trim();
            if (!trimmed) return 'Please enter a value.';
            var allowDecimal = kind === 'decimal';
            if (allowDecimal) {
                if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return 'Please enter a valid number.';
            } else {
                if (!/^-?\d+$/.test(trimmed)) return 'Please enter a whole number.';
            }
            var n = Number(trimmed);
            var min = Number(el.min);
            var max = Number(el.max);
            if (!Number.isFinite(n)) return 'Please enter a valid number.';
            if (n < min) return 'Must be at least ' + min + '.';
            if (n > max) return 'Must be at most ' + max + '.';
            return 'Please enter a valid value.';
        }

        function validateWeight() {
            var v = parseStrictDecimal(weightEl.value);
            if (v === null || v < 30 || v > 300) {
                setFieldError(weightEl, describeNumberError(weightEl, 'decimal'));
                return null;
            }
            setFieldError(weightEl, '');
            return v;
        }

        function validateHeight() {
            var v = parseStrictDecimal(heightEl.value);
            if (v === null || v < 120 || v > 230) {
                setFieldError(heightEl, describeNumberError(heightEl, 'decimal'));
                return null;
            }
            setFieldError(heightEl, '');
            return v;
        }

        function validateAge() {
            var v = parseStrictInteger(ageEl.value);
            if (v === null || v < 14 || v > 90) {
                setFieldError(ageEl, describeNumberError(ageEl, 'integer'));
                return null;
            }
            setFieldError(ageEl, '');
            return v;
        }

        function validateSteps() {
            var v = parseStrictInteger(stepsEl.value);
            if (v === null || v < 0 || v > 40000) {
                setFieldError(stepsEl, describeNumberError(stepsEl, 'integer'));
                return null;
            }
            setFieldError(stepsEl, '');
            return v;
        }

        function validateSex() {
            var v = sexEl.value;
            if (ALLOWED_SEX.indexOf(v) === -1) {
                setFieldError(sexEl, 'Please choose an option.');
                return null;
            }
            setFieldError(sexEl, '');
            return v;
        }

        function validateGoal() {
            var v = goalEl.value;
            if (ALLOWED_GOAL.indexOf(v) === -1) {
                setFieldError(goalEl, 'Please choose a goal.');
                return null;
            }
            setFieldError(goalEl, '');
            return v;
        }

        function validateAll() {
            var weight = validateWeight();
            var age = validateAge();
            var sex = validateSex();
            var height = validateHeight();
            var steps = validateSteps();
            var goal = validateGoal();

            if (weight === null || age === null || sex === null ||
                height === null || steps === null || goal === null) {
                return null;
            }
            return {
                weightKg: weight,
                age: age,
                sex: sex,
                heightCm: height,
                dailySteps: steps,
                goal: goal
            };
        }

        function hideResults() {
            if (!results.hasAttribute('hidden')) {
                results.classList.remove('is-visible');
                results.setAttribute('hidden', '');
            }
        }

        function revealResults() {
            if (results.hasAttribute('hidden')) {
                results.removeAttribute('hidden');
                // Force a reflow so the transition from the initial state actually runs.
                void results.offsetWidth;
                results.classList.add('is-visible');
            } else {
                results.classList.add('is-visible');
            }
        }

        function renderResults(targets) {
            outCalories.textContent = formatWholeNumber(targets.calorieTarget);
            outProtein.textContent = formatWholeNumber(targets.proteinGrams);
            outCarbs.textContent = formatWholeNumber(targets.carbGrams);
            outFat.textContent = formatWholeNumber(targets.fatGrams);
            outWater.textContent = formatLiters(targets.waterMl);
            outSteps.textContent = formatWholeNumber(targets.stepTarget);
            outSummary.textContent = buildSummary(targets.weeklyWeightChangeKg, targets.goal);
            announcer.textContent = 'Your targets have been calculated. ' + outSummary.textContent;
        }

        function onSubmit(event) {
            event.preventDefault();
            var inputs = validateAll();
            if (!inputs) {
                hideResults();
                var firstInvalid = form.querySelector('[aria-invalid="true"]');
                if (firstInvalid) firstInvalid.focus();
                return;
            }
            var targets = computeTargets(inputs);
            renderResults(targets);
            revealResults();
        }

        function revalidateField(el) {
            if (el === weightEl) return validateWeight();
            if (el === ageEl) return validateAge();
            if (el === sexEl) return validateSex();
            if (el === heightEl) return validateHeight();
            if (el === stepsEl) return validateSteps();
            if (el === goalEl) return validateGoal();
            return null;
        }

        function messageFromValidity(el) {
            var v = el.validity;
            if (v.valueMissing) return 'Please enter a value.';
            if (v.badInput) return 'Please enter a valid number.';
            if (v.rangeUnderflow) return 'Must be at least ' + el.min + '.';
            if (v.rangeOverflow) return 'Must be at most ' + el.max + '.';
            if (v.stepMismatch) {
                return el.step === '1' ? 'Please enter a whole number.' :
                    'Please enter a valid value.';
            }
            if (v.typeMismatch) return 'Please enter a valid number.';
            return 'Please enter a valid value.';
        }

        function onInvalid(event) {
            var el = event.target;
            // Pair the native invalid signal with our inline error so the user sees both.
            setFieldError(el, messageFromValidity(el));
        }

        function onFieldInput(event) {
            var el = event.target;
            // Any edit after a successful calculation hides the previous results.
            if (!results.hasAttribute('hidden')) hideResults();
            // Clear a stale error as soon as the field becomes valid again,
            // but don't push errors into fields the user hasn't finished editing.
            if (el.getAttribute('aria-invalid') === 'true') {
                revalidateField(el);
            }
        }

        function onRecalculate() {
            var behavior = reducedMotion() ? 'auto' : 'smooth';
            if (typeof form.scrollIntoView === 'function') {
                form.scrollIntoView({ behavior: behavior, block: 'start' });
            }
            weightEl.focus({ preventScroll: true });
        }

        clearAllErrors();

        form.addEventListener('submit', onSubmit);
        recalcButton.addEventListener('click', onRecalculate);

        [weightEl, ageEl, heightEl, stepsEl].forEach(function (el) {
            el.addEventListener('invalid', onInvalid);
            el.addEventListener('input', onFieldInput);
        });

        [sexEl, goalEl].forEach(function (el) {
            el.addEventListener('invalid', onInvalid);
            el.addEventListener('change', onFieldInput);
        });
    }

    initCalculator();
})();
