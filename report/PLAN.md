# Report Plan — MIE 286 Final Report

**Team 51:** Markiyan Konyk, Jessica Yi, Memo Ozdincer  
**Due:** April 7, 2026  
**Format:** Max 10 pages (excl. Appendix, References, Title Page). ≥1.5 spacing, 12pt.  
**Figures come from:** `../analysis/` R scripts → `figures/`

---

## Rubric Mapping (100 pts)

| Section | Pts | Pages | Key requirements |
|---------|-----|-------|-----------------|
| Introduction | 5 | 0.5 | Interesting research question |
| Background | 5 | 0.75 | Motivates the research question clearly |
| Methods | 25 | 2.5 | Procedures, biases/limitations, IV/DV, reproducibility |
| Analysis | 20 | 1.5 | Correct course material, one/two-tailed justified, hypotheses stated |
| Results | 25 | 3.0 | Descriptive stats (mean, variance) for BOTH DVs + covariates, inferential stats, graphs + tables |
| Conclusion | 5 | 1.0 | Implications, limitations, lessons learned |
| Appendices | 5 | ∞ | Assumption checks, R code, experimental setup |
| Writing | 5 | — | Grammar, concise, logical flow |
| Formatting | 5 | — | References, sig figs, page limit |

---

## What Changed From Proposal (Must Address)

### Proposal feedback (Fan Wang, Feb 28):
- **Method 27/30:** "Two conditions differ not only in modality but also in the amount of information conveyed."
  - **FIX:** Removed metrics HUD from visual. Both conditions now have identical HUD (trial counter + score + streak) and convey same 3 levels: fast hit / slow hit / miss. Explain in Methods.
- **Analysis 4/5:** "You could also use plots."
  - **FIX:** 4+ figures in Results section.

### Other changes:
- Target radius: 40→35px
- Trial count: 30 participants did 30 trials/block, 24 did 60 trials/block. Address in limitations.
- Practice: 10→5 trials
- Condition order: manual→randomized
- Age range: removed (all 18-24)
- Added gamification (scoring, leaderboard) mid-collection
- N=54 participants (exceeds N≥24 by 2x)

### Hypothesis reversal (important!):
- Proposal predicted auditory = faster (MRT: less interference). Data shows VISUAL = faster.
- This is because the gold/green visual indicator created a speed incentive absent in auditory.
- Frame as: MRT's interference prediction was overridden by a motivational effect. More interesting than simple confirmation.

---

## Section-by-Section Content

### 1. Introduction (0.5 pages)
- Hook: feedback is everywhere in UI design (games, dashboards, factory systems)
- Research question: Does feedback modality (visual vs auditory) change the speed-accuracy tradeoff in a target-selection task?
- State the three hypotheses (reworded clearly from proposal)
- Why it matters: Cognitive Load Theory, Multiple Resource Theory

### 2. Background (0.75 pages)
- Wickens' MRT [1,2]: visual task + visual feedback = channel overload → predicts auditory feedback should reduce interference
- Cognitive Load Theory [3]: distributing load across modalities reduces cognitive burden
- Fitts' Law [4,5]: motor pointing tasks have information-capacity constraints
- SAT [6]: Heitz 2014 — faster responses incur more errors, but the *structure* of the tradeoff can change
- Prior work: Akamatsu et al. [7] — auditory feedback reduces time in pointing tasks; Sigrist et al. [8] — auditory supports motor learning
- Gap: whether feedback modality changes the SAT *structure* (not just means) remains unexplored

### 3. Methods (2.5 pages)
- **Participants:** N=54, ages 18-24, university students, convenience sampling. Covariates: device type (Mouse/Trackpad/Other), gaming frequency (Never/Rarely/Weekly/Daily).
- **Apparatus:** Browser-based (GitHub Pages). Canvas 800×500px, target radius 35px, random placement, 400ms ITI. Timing: performance.now() (sub-ms).
- **IV — Feedback Type (within-subject, 2 levels):**
  - Visual: border glow — gold (<600ms hit), green (≥600ms hit), red+shake (miss). 150ms.
  - Auditory: tones — 880Hz (fast hit), 440Hz (slow hit), 180Hz (miss). 200ms.
  - **Both convey identical 3-level information.** Identical HUD. (Addresses proposal feedback.)
- **DVs:**
  - DV₁: Reaction time (ms) — target onset to click
  - DV₂: Radial error (px) — Euclidean distance, click to target center
- **Procedure:** Consent → Instructions → 5 practice → Block 1 (30 or 60 trials) → Break → Block 2 → End
- **Design:** Within-subject, counterbalanced (randomized VA or AV)
- **Controls:** Target size, canvas, ITI, instructions constant. Positions randomized. Practice controls novelty.
- **Biases/limitations paragraph:** Convenience sampling, device variability, mixed trial counts, uncontrolled audio environment, gamification introduced mid-collection, some repeat participants.

### 4. Analysis (1.5 pages)
- **Cleaning:** Exclude RT <150ms or >8000ms. Keep all participants regardless of trial count (per-participant means normalize this).
- **Aggregation:** Per-participant mean RT and mean radial error, separately for visual and auditory → paired data.
- **Assumption checks:** Shapiro-Wilk on within-subject differences (d_RT, d_error). QQ plots (appendix). If non-normal → Wilcoxon.
- **H₁ (Speed):** Paired t-test, **one-tailed** (alt: visual RT ≠ auditory RT — actually, since our data reverses the prediction, use **two-tailed** to be safe. Or: reframe H₁ as "RT will differ between conditions" and use two-tailed). Report t, df, p, Cohen's d.
  - DECISION POINT: If we keep original directional hypothesis and it's reversed, we fail to reject. If we reframe as two-tailed "RT differs," we can detect the effect. Discuss with team. The safest approach: state the original directional prediction, note it was reversed, report two-tailed test showing the difference is significant in the opposite direction.
- **H₂ (Accuracy):** Paired t-test, same logic. Visual error > auditory error — this IS the predicted direction if we frame it as "the faster condition has more error."
- **H₃ (SAT):** Pearson r(RT, error) per condition. Fisher's z-test comparing correlations (two-tailed). Optional: ANCOVA interaction test error ~ RT × condition.
- **State null and alternative hypotheses explicitly for each test.**

### 5. Results (3 pages, including figures)
- **Table 1:** Descriptive stats — Mean ± SD for RT, radial error, hit rate by condition
- **Table 2:** Covariate breakdown — Mean RT, hit rate by device type and gaming frequency
- **Figure 1:** Boxplot — RT by condition (side-by-side)
- **Figure 2:** Boxplot — Radial error by condition
- **Figure 3:** Scatter plot — RT vs radial error, colored by condition, with regression lines (THE key SAT figure for H₃)
- **Figure 4:** Bar chart — covariate comparison (device type or gaming frequency)
- **Inferential results:** Full reporting for each test. Example: "A paired t-test revealed..."
- **Secondary finding:** Tilt effect — P(miss|prev miss) = 12.4% vs 4.2%. Chi-square. One paragraph.

### 6. Conclusion (1 page)
- **Summary:** Visual feedback made participants faster but less precise. SAT correlation stronger under visual. The gold/green speed indicator created a motivational effect that overrode MRT's predicted channel interference.
- **Real-world implication:** Visual performance feedback creates speed pressure. In safety-critical UIs, auditory feedback may better preserve accuracy.
- **Limitations:** Convenience sampling, device variability, mixed trial counts, leaderboard effect, repeat participants, uncontrolled audio, accuracy ceiling (95%+), visual feedback inherently more salient than tones.
- **Lessons learned:** Counterbalancing essential (VA vs AV showed different carryover). Practice rounds controlled novelty. Gamification boosted recruitment but may have changed behavior. Gold/green distinction was an unintended speed incentive — itself evidence for the visual speed-chasing effect.

### 7. References
- Keep [1-8] from proposal
- Add Heitz (2014) full citation if not already included
- Any new references needed

### 8. Appendices
- QQ plots
- Shapiro-Wilk outputs
- Full R code (commented)
- Experiment screenshots (both conditions)
- Consent form screenshot
- Data summary (N per condition order, device breakdown)
- Attribution table

---

## Figure List

| # | Type | Shows | File |
|---|------|-------|------|
| 1 | Boxplot | RT by condition | `figures/rt_boxplot.pdf` |
| 2 | Boxplot | Radial error by condition | `figures/error_boxplot.pdf` |
| 3 | Scatter | RT vs error, colored by condition, regression lines | `figures/sat_scatter.pdf` |
| 4 | Bar chart | RT by device type or gaming frequency | `figures/covariate_bar.pdf` |
| A1 | QQ plot | RT differences normality | `figures/qq_rt.pdf` |
| A2 | QQ plot | Error differences normality | `figures/qq_error.pdf` |

---

## Course Methods Mapping (MIE 286 Syllabus)

Every statistical method we use should trace back to course material. Rubric says "Correct application of course material."

| Our Method | Syllabus Topic | Week |
|-----------|---------------|------|
| Mean, SD, variance | Measures of location and variability | 1 |
| Histograms, boxplots | Data display and graphical methods, quantiles | 1, 7-8 |
| Correlation coefficient (Pearson r) | Covariance and correlation of random variables | 2-3 |
| Normal distribution, QQ plots | Continuous probability distributions | 4-5 |
| Chi-squared test (tilt effect) | Chi-squared distribution | 6 |
| Sampling distributions, CLT | Central limit theorem, t-distribution | 7-8 |
| Confidence intervals | Point and interval estimators | 9 |
| Paired t-test (H₁, H₂) | Hypothesis testing, tests on means, Type I/II errors | 10 |
| Shapiro-Wilk normality check | Goodness of fit tests | 10 |
| One vs two-tailed test justification | Significance level and p-value | 10 |
| Simple linear regression (SAT slopes) | Least squares, model fitting, residual analysis | 11 |
| Comparing regression slopes (H₃) | Inferences for regression coefficients | 11 |
| Interaction term (error ~ RT × condition) | Multiple linear regression | 12-13 |

**Methods NOT in syllabus but defensible:**
- Cohen's d (effect size) — standard companion to t-tests, trivially derived from course material (it's just mean/SD)
- Fisher's z-test for comparing correlations — can be replaced with comparing regression slopes (Week 11), which IS in the syllabus. Frame H₃ as: "fit two regression models (one per condition), compare slopes via interaction term in multiple regression (Week 12)"
- Wilcoxon signed-rank — only if normality fails. Mention as the nonparametric alternative. If normality holds, stick with paired t-test.

**Recommendation:** For H₃, instead of Fisher's z, use the multiple regression interaction approach:
```
model <- lm(error ~ rt * condition, data = clean_trials)
```
This is directly from Week 12-13 (multiple linear regression with interaction). A significant `rt:condition` interaction means the SAT slope differs between conditions. This is stronger course material alignment than Fisher's z.

---

## Sig Fig Standards
- RT: whole milliseconds (e.g., 704 ms)
- Radial error: 1 decimal (e.g., 15.5 px)
- p-values: 3 decimals (e.g., p = .003), or p < .001
- Cohen's d: 2 decimals (e.g., d = 0.45)
- Percentages: 1 decimal (e.g., 95.1%)
- Correlation r: 3 decimals (e.g., r = -.170)
