# AI Comparison — Body Target Calculator

Two implementations of the same brief, built by two different AI assistants, kept side-by-side so you can compare the output.

Both apps compute approximate daily **calorie, macro, water, and step targets** from a few personal inputs (weight, height, age, sex, average daily steps, and a goal). Each is a self-contained static site: plain HTML, CSS, and JavaScript — no build step, no dependencies.

## Project layout

```
ai-comparison/
├── Astra/      # Implementation by Astra
│   ├── index.html
│   ├── app.js
│   └── style.css
└── claude/     # Implementation by Claude
    ├── index.html
    ├── app.js
    └── style.css
```

## Running

Each folder is a static site. Open either `index.html` directly in a browser, or serve the folder with any static file server, for example:

```powershell
# From the repo root
cd Astra
python -m http.server 8000
# then open http://localhost:8000
```

Do the same inside `claude/` to view the other version.

## The shared brief

Both implementations expose the same form and compute the same six outputs using the same underlying formulas.

The full prompt below was given verbatim to each assistant — no clarifications, no follow-up turns. Each folder is that assistant's single-shot response.

### Formula summary

| Target        | Formula                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| BMR           | Mifflin–St Jeor (`10·kg + 6.25·cm − 5·age + 5` / `− 161`)              |
| TDEE          | BMR × activity multiplier based on daily steps (1.2 → 1.8)              |
| Calories      | TDEE × `0.8` (fat loss), `1.0` (maintain), or `1.1` (gain)              |
| Protein       | `1.4 g/kg` (maintain) or `1.8 g/kg` (loss / gain)                       |
| Fat           | `25%` of calorie target ÷ 9 kcal/g                                      |
| Carbs         | Remaining calories after protein and fat                                |
| Water         | `35 ml/kg` + `350 ml` per complete 5000-step block above 5000           |
| Step target   | `steps × 1.15`, capped at 15 000                                        |
| Weekly change | `(calories − TDEE) × 7 ÷ 7700` kg/week                                  |

Shared input ranges: weight 30–300 kg, age 14–90, height 120–230 cm, steps 0–40 000.

### The exact prompt

<details>
<summary>Click to expand the full brief sent to both assistants</summary>

````
Build a complete, polished single-page "Body Target Calculator" using exactly three files:

1. index.html
2. style.css
3. app.js

The application must work by opening index.html directly in a browser. Use only HTML, plain CSS, and vanilla JavaScript. No frameworks, build tools, dependencies, CDN links, external fonts, remote assets, or network requests.

Do not ask clarification questions. Follow the specifications below exactly.

FILE STRUCTURE

index.html:
- Use semantic HTML, including main, headings, a form, and a results section.
- Bind every input and select to a visible label using matching for/id attributes.
- Include the stylesheet and load app.js using a classic deferred script, not type="module".
- Keep all CSS and JavaScript in their respective files.
- The results section must initially have the hidden attribute.
- Include a viewport meta tag and an appropriate page title.

style.css:
- Use valid plain CSS.
- Define colors, spacing, radii, and shadows as custom properties in :root.
- Use these properties consistently.
- No preprocessor syntax or inline styles.

app.js:
- Use a single named initialization function inside an IIFE and call it once.
- Do not expose variables or functions on window.
- Group pure calculation functions at the top and DOM wiring at the bottom.
- Give every calculation function a one-line comment explaining its purpose.
- Calculation functions must accept arguments and return values without reading or modifying the DOM.
- Use textContent for dynamic text.

INPUT CARD

Card heading: "Your information"

All fields are required:

- Weight (kg): number, min 30, max 300, step 0.1
- Age: number, min 14, max 90, step 1
- Sex: select with Male and Female
- Height (cm): number, min 120, max 230, step 0.1
- Average daily steps: number, min 0, max 40000, step 1
  Helper text: "Use your normal average, not your maximum."
- Goal: select with:
  - Fat loss + muscle preservation
  - Maintain
  - Lean muscle gain

Use an empty placeholder option for both selects. Do not prefill numeric inputs.

Submit button: "Calculate my targets"

VALIDATION

- Define required, min, max, and step constraints in HTML.
- Keep native browser validation enabled.
- Add a small JavaScript validation layer using the Constraint Validation API.
- Handle native invalid events so inline errors also appear when browser validation prevents the submit event.
- Show a specific, readable inline error beneath each invalid field.
- Connect helper and error text with aria-describedby.
- Set aria-invalid="true" for invalid fields and remove it when corrected.
- Validate select values against the allowed options.
- Do not use parseFloat in a way that accepts partially numeric strings.
- Never display results when any field is invalid.
- After a successful calculation, any subsequent input change must hide the previous results until the form is submitted successfully again.
- Corrected fields must not retain stale error messages.

CALCULATIONS

Use the following formulas exactly. Keep full precision throughout calculations and round only when displaying results.

1. BMR, using Mifflin-St Jeor:
   - Male: 10 × weightKg + 6.25 × heightCm − 5 × age + 5
   - Female: 10 × weightKg + 6.25 × heightCm − 5 × age − 161

2. Activity multiplier, based on daily steps:
   - Below 5000: 1.2
   - 5000–7499: 1.375
   - 7500–9999: 1.5
   - 10000–12499: 1.65
   - 12500 or more: 1.8

3. TDEE:
   BMR × activityMultiplier

4. Daily calorie target:
   - Fat loss: TDEE × 0.8
   - Maintain: TDEE
   - Lean muscle gain: TDEE × 1.1

5. Daily protein:
   - Fat loss and lean muscle gain: weightKg × 1.8 grams
   - Maintain: weightKg × 1.4 grams

6. Daily fat:
   calorieTarget × 0.25 ÷ 9 grams

7. Daily carbs:
   (calorieTarget − proteinGrams × 4 − fatGrams × 9) ÷ 4 grams

8. Daily water:
   - Base: weightKg × 35 milliliters
   - Additional water: 350 milliliters for each complete block of 5000 steps above the first 5000 steps
   - Formula:
     weightKg × 35 + Math.floor(Math.max(0, dailySteps − 5000) / 5000) × 350
   - Therefore, 5000 and 9999 steps add no extra water; 10000 steps add 350 ml.

9. Daily step target:
   Math.min(dailySteps × 1.15, 15000)
   - Apply this formula exactly, including when current steps exceed 15000.

10. Signed estimated weekly weight change:
    (calorieTarget − TDEE) × 7 ÷ 7700
    - Negative means estimated loss.
    - Positive means estimated gain.
    - Zero means maintenance.

11. Rough timeline:
    - No target-weight input is provided, so show the estimated time to lose or gain 1 kg.
    - Weeks per kg = 1 ÷ Math.abs(weeklyWeightChange).
    - For maintenance, show a maintenance message without dividing by zero.

Do not add alternative formulas, minimum calorie floors, or additional input fields.

RESULTS

- Reveal the results below the form without reloading the page.
- Use a responsive CSS grid containing six cards:
  - Calories, kcal/day
  - Protein, g/day
  - Carbs, g/day
  - Fat, g/day
  - Water, L/day
  - Step target, steps/day
- Display calories, macros, and steps rounded to the nearest whole number.
- Display water in liters with two decimal places.
- Use locale-aware thousands separators for whole-number results.
- Include a single summary line showing:
  - Estimated weekly loss or gain, with two decimal places in kg
  - Rough weeks to lose or gain 1 kg, with one decimal place
  - Or "Estimated weight maintenance" for the maintain goal
- Clearly describe estimates as approximate.
- Include a short note that the formula does not account for all individual factors and that ages 14–17 should seek individualized guidance before using weight-change targets.
- Provide an accessible announcement of newly calculated results without making every result card a separate live region.
- Add a "Recalculate" button with type="button" that scrolls to the form and focuses the weight field without resetting the inputs.
- Use a CSS fade/slide transition when revealing results. Ensure the transition actually runs when removing hidden.
- Respect prefers-reduced-motion for both animation and programmatic scrolling.

VISUAL DESIGN

- Clean, polished light theme.
- Light page background: #F7F8FA.
- White cards, 16px radius, soft shadows, generous padding.
- One accent color, used only for the primary button and prominent result numbers.
- System font stack, large bold headings, muted gray helper text.
- Mobile-first layout.
- Single-column inputs below 640px and two-column inputs at 640px and above.
- Results grid: one column on small phones, two columns on larger screens, and three columns on desktop.
- No horizontal overflow at 320px viewport width.
- Buttons and controls must be comfortable to use on touchscreens.
- Visible keyboard focus rings and accessible text contrast.
- Dark mode through prefers-color-scheme, implemented entirely by overriding CSS variables.
- Keep the interface in English.
- Do not use emojis, illustrations, decorative icons, or additional features.

ACCEPTANCE CHECKS

Before returning the files, review the implementation against these cases:

- Empty or invalid inputs do not reveal results.
- Decimal weight and height are accepted; decimal age and steps are rejected.
- Activity boundaries at 4999, 5000, 7499, 7500, 9999, 10000, 12499, and 12500 are correct.
- Water calculations handle 5000, 9999, 10000, and 15000 steps correctly.
- Zero steps produces a step target of zero.
- The step target never exceeds 15000.
- Maintenance does not produce Infinity or NaN.
- Editing a field after calculating hides stale results.
- Keyboard operation, reduced motion, and dark mode work.
- All files work together under file://.

Numerical reference:
For a male aged 30, weighing 80 kg, height 180 cm, taking 8000 daily steps, with the fat-loss goal:
- BMR: 1780
- Activity multiplier: 1.5
- TDEE: 2670
- Calories: 2136
- Protein: 144 g
- Fat before display rounding: 59.333333… g
- Carbs: 256.5 g
- Water: 2.80 L
- Step target: 9200
- Weekly weight change before display rounding: −0.4854545… kg
- Displayed summary: approximately 0.49 kg loss per week and 2.1 weeks to lose 1 kg

OUTPUT FORMAT

Return exactly three complete code blocks in this order:
1. index.html in an html code block
2. style.css in a css code block
3. app.js in a javascript code block

Place the filename immediately above each code block.

No explanations, setup instructions, abbreviated sections, placeholders, TODOs, or omitted code. Do not claim to have run browser tests unless you actually did.
````

</details>

## What differs between the two

Same math, same inputs, same outputs — but the implementations diverge in how they're built:

- **Validation.** `Astra/` leans on the browser's `ValidityState` API and `setCustomValidity`. `claude/` writes its own strict integer / decimal parsers with regex and layers its messages on top of the native `invalid` event.
- **Code shape.** `Astra/app.js` is compact (~150 lines) with the whole target calculation in one function. `claude/app.js` (~420 lines) breaks every step into a single-purpose helper.
- **UI copy and layout.** Both use card-based result grids but differ in headings, helper text, button labels, and the exact wording of the weekly-change summary.
- **Styling.** Different color palettes, spacing scales, and typographic rhythm — see each folder's `style.css`.

## Disclaimer

The numbers these calculators produce are approximate starting points. They don't account for body composition, medical conditions, training load, sleep, or other individual factors. Teens (14–17) should seek individualized guidance before using weight-change targets.
