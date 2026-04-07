# Analysis Plan — MIE 286 Data Analysis

**All final outputs must be in R.**  
**Figures output to:** `../report/figures/` (PDF format for LaTeX)  
**Data lives in:** `data/` (CSVs from experiment)

---

## Directory Structure

```
analysis/
├── data/                  ← participant CSVs
├── scripts/
│   ├── 01_load_clean.R    ← load all CSVs, clean, aggregate
│   ├── 02_descriptives.R  ← summary tables, covariate breakdowns
│   ├── 03_assumptions.R   ← Shapiro-Wilk, QQ plots
│   ├── 04_inferential.R   ← paired t-tests (H1, H2), Fisher's z (H3)
│   ├── 05_plots.R         ← all figures for the report
│   ├── 06_secondary.R     ← tilt effect, condition order check, extras
│   └── 00_run_all.R       ← sources everything in order
├── output/                ← intermediate RDS/CSV outputs
├── PLAN.md                ← this file
└── ../report/figures/     ← final PDF figures go here
```

---

## Pipeline Steps

### Step 1: Load & Clean (`01_load_clean.R`)

**Input:** All CSVs in `data/`  
**Output:** `output/clean_trials.rds`, `output/participant_means.rds`

```r
# Pseudocode:
# 1. List all CSV files in data/
# 2. Read each, rbind into one dataframe
# 3. Parse columns: rt = as.numeric(reaction_time_ms), error = as.numeric(radial_error),
#    hit = as.integer(is_hit), condition, block, trial, participant_id, 
#    condition_order, device_type, gaming_freq
# 4. Exclude RT outliers: rt < 150 | rt > 8000
# 5. Count excluded rows, report
# 6. Save clean trial-level data → output/clean_trials.rds
#
# 7. Aggregate per-participant means:
#    For each participant × condition:
#      mean_rt, sd_rt, mean_error, sd_error, hit_rate, n_trials
#    Wide format: one row per participant with visual_rt, auditory_rt, visual_error, auditory_error
# 8. Save → output/participant_means.rds
```

**Key decisions:**
- Participants with multiple attempts (Aarav, Adam, Jaiden, Nate): treat each attempt as separate observation. They have different filenames/timestamps. Everyone effectively only did it once per attempt.
- Mixed trial counts (30 vs 60): keep all. Per-participant means normalize this.
- Note: some files may have 59 or 119 data rows (header counted differently). Use actual row count.

---

### Step 2: Descriptive Statistics (`02_descriptives.R`)

**Input:** `output/participant_means.rds`, `output/clean_trials.rds`  
**Output:** Console output + tables for report

**Required tables (rubric: "Descriptive statistics provided for both DVs and covariates"):**

**Table 1: Main DVs by condition**
| | Visual (M ± SD) | Auditory (M ± SD) |
|---|---|---|
| Reaction Time (ms) | 704 ± ??? | 718 ± ??? |
| Radial Error (px) | 15.5 ± ??? | 14.4 ± ??? |
| Hit Rate (%) | 95.1 ± ??? | 95.7 ± ??? |

Note: These should be means of per-participant means, not raw trial means. The SDs are between-participant SDs of per-participant means.

**Table 2: Covariates**
| Device | N | Mean RT (ms) | Hit Rate (%) |
|--------|---|-------------|-------------|
| Mouse | ? | 633 | 94.6 |
| Trackpad | ? | 775 | 95.5 |
| Other | ? | 679 | 96.2 |

| Gaming Freq | N | Mean RT (ms) | Hit Rate (%) |
|-------------|---|-------------|-------------|
| Never | ? | 692 | 95.9 |
| Rarely | ? | 738 | 95.1 |
| Weekly | ? | 678 | 94.6 |
| Daily | ? | 770 | 97.7 |

Also report: N per condition order (VA vs AV), total participants, total trials.

---

### Step 3: Assumption Checks (`03_assumptions.R`)

**Input:** `output/participant_means.rds`  
**Output:** `../report/figures/qq_rt.pdf`, `../report/figures/qq_error.pdf`, console output

**Required (rubric: "Assumption checks" in Appendices):**

```r
# 1. Compute within-subject differences:
#    d_rt = visual_rt - auditory_rt  (per participant)
#    d_error = visual_error - auditory_error  (per participant)
#
# 2. Shapiro-Wilk test:
#    shapiro.test(d_rt)
#    shapiro.test(d_error)
#
# 3. QQ plots:
#    qqnorm(d_rt); qqline(d_rt)  → save as qq_rt.pdf
#    qqnorm(d_error); qqline(d_error)  → save as qq_error.pdf
#
# 4. Decision:
#    If p < 0.05 → use wilcox.test() instead of t.test()
#    If p ≥ 0.05 → paired t-test is valid
```

---

### Step 4: Inferential Statistics (`04_inferential.R`)

**Input:** `output/participant_means.rds`  
**Output:** Console output (stats for report text)

**H₁ — Reaction Time:**
```r
# Original prediction: auditory RT < visual RT (MRT)
# Data shows: visual RT < auditory RT (reversed!)
# 
# Approach: Use two-tailed paired t-test. Report the reversal.
# t.test(participant_means$visual_rt, participant_means$auditory_rt, 
#        paired = TRUE, alternative = "two.sided")
# 
# Effect size:
# cohen_d = mean(d_rt) / sd(d_rt)
#
# Report: t, df, p, 95% CI, Cohen's d
```

**H₂ — Radial Error:**
```r
# Prediction: faster condition has more error (SAT)
# Data: visual error (15.5) > auditory error (14.4) — visual is the faster condition
# Direction: visual error > auditory error → one-tailed
#
# t.test(participant_means$visual_error, participant_means$auditory_error,
#        paired = TRUE, alternative = "greater")
#
# Effect size: Cohen's d
# Report: t, df, p, Cohen's d
```

**H₃ — SAT Structure:**
```r
# PRIMARY approach: Multiple linear regression with interaction (Week 12-13)
# This is the strongest course-material-aligned method.
#
# model <- lm(error ~ rt * condition, data = clean_trials)
# summary(model)
# anova(model)
#
# Key output: the rt:condition interaction term
#   If significant → SAT slope differs between conditions
#   The coefficient gives the DIFFERENCE in slopes
#
# SUPPORTING: Pearson correlation per condition (Week 2-3, 11)
# r_vis = cor.test(visual_trials$rt, visual_trials$error)
# r_aud = cor.test(auditory_trials$rt, auditory_trials$error)
# Report r and p for each — readers can see the difference directly
#
# SUPPORTING: Simple linear regression per condition (Week 11)
# lm(error ~ rt, data = visual_trials)  → get slope, R², residual analysis
# lm(error ~ rt, data = auditory_trials) → compare slopes visually
#
# NOTE: Fisher's z-test for comparing correlations is valid but NOT
# in the syllabus. The interaction term in multiple regression achieves
# the same thing and IS in the syllabus (Week 12-13). Prefer this.
```

---

### Step 5: Plots (`05_plots.R`)

**Input:** `output/clean_trials.rds`, `output/participant_means.rds`  
**Output:** All PDFs to `../report/figures/`

**Figure 1: RT Boxplot** (`rt_boxplot.pdf`)
```r
# Side-by-side boxplots: visual RT vs auditory RT
# Use per-participant means (not raw trials) for proper within-subject comparison
# ggplot: geom_boxplot + geom_jitter (show individual participants)
# Colors: blue for visual, orange for auditory
# Labels: x = "Feedback Condition", y = "Mean Reaction Time (ms)"
# Size: 6" x 4"
```

**Figure 2: Error Boxplot** (`error_boxplot.pdf`)
```r
# Same format as Figure 1 but for radial error
# y = "Mean Radial Error (px)"
```

**Figure 3: SAT Scatter** (`sat_scatter.pdf`)
```r
# THE key figure. Scatter plot of RT vs radial error at TRIAL level.
# Color by condition (visual = blue, auditory = orange)
# Add regression lines per condition (geom_smooth(method="lm"))
# Different slopes = different SAT structure
# Labels: x = "Reaction Time (ms)", y = "Radial Error (px)"
# Include r values in legend or annotation
# Size: 7" x 5"
```

**Figure 4: Covariate Bar** (`covariate_bar.pdf`)
```r
# Bar chart: Mean RT by device type (Mouse, Trackpad, Other)
# Error bars: ±1 SE
# Or: grouped bars by condition within each device type
# Size: 6" x 4"
```

**Appendix figures:**

**Figure A1: QQ RT** (`qq_rt.pdf`) — from Step 3
**Figure A2: QQ Error** (`qq_error.pdf`) — from Step 3

**Optional bonus figures (if they add value):**
- `rt_by_trial.pdf` — RT over trial number within block, by condition (performance curves)
- `miss_vectors.pdf` — arrows from target to click on misses, colored by condition (click bias)
- `condition_order.pdf` — boxplot of RT by condition, faceted by VA vs AV order

---

### Step 6: Secondary Analyses (`06_secondary.R`)

**Input:** `output/clean_trials.rds`  
**Output:** Console output for report text

**Tilt effect (include in Results — one paragraph):**
```r
# For each consecutive pair of trials within the same block:
#   Count: miss_after_miss, miss_after_hit, total_after_miss, total_after_hit
# Chi-square test or proportion test:
#   prop.test(c(miss_after_miss, miss_after_hit), 
#             c(total_after_miss, total_after_hit))
# Expected: P(miss|prev miss) ≈ 12.4% vs P(miss|prev hit) ≈ 4.2%
```

**Condition order check (include in Results or Methods — one paragraph):**
```r
# Compare VA group vs AV group on main DVs
# Independent samples t-test on overall mean RT between VA and AV participants
# If not significant → counterbalancing worked
# If significant → discuss carryover effects
```

**RT variance comparison (mention in Discussion):**
```r
# var.test() or leveneTest() comparing RT variance between conditions
# Visual RT SD ≈ 167ms vs Auditory RT SD ≈ 212ms
# Visual tightens variance → participants lock onto a speed target
```

---

### Step 7: Run All (`00_run_all.R`)

```r
# Master script that sources everything in order:
source("scripts/01_load_clean.R")
source("scripts/02_descriptives.R")
source("scripts/03_assumptions.R")
source("scripts/04_inferential.R")
source("scripts/05_plots.R")
source("scripts/06_secondary.R")
```

---

## Key Numbers to Verify in R

These are from quick Python analysis. R must confirm:

| Metric | Python estimate | R must verify |
|--------|----------------|---------------|
| N participants | 54 | ✓ |
| Visual mean RT | 704ms | ✓ (per-participant means may differ) |
| Auditory mean RT | 718ms | ✓ |
| Visual mean error | 15.5px | ✓ |
| Auditory mean error | 14.4px | ✓ |
| Visual hit rate | 95.1% | ✓ |
| Auditory hit rate | 95.7% | ✓ |
| SAT r visual | -0.170 | ✓ |
| SAT r auditory | -0.126 | ✓ |
| P(miss\|prev miss) | 12.4% | ✓ |
| P(miss\|prev hit) | 4.2% | ✓ |

**IMPORTANT:** Python numbers are raw trial-level. R analysis should use per-participant means for the t-tests (proper within-subject analysis). The actual significance depends on the between-participant variability, not the raw numbers.

---

## Course Methods Alignment (MIE 286 Syllabus)

Every method traces to syllabus content. Rubric: "Correct application of course material."

| Method | What we use it for | Syllabus Week |
|--------|-------------------|---------------|
| Mean, SD, variance | Descriptive stats for RT, error, covariates | 1 |
| Boxplots, histograms | Figures 1-2, data visualization | 1, 7-8 |
| Correlation coefficient | Pearson r for SAT (RT vs error) per condition | 2-3 |
| Normal distribution | Shapiro-Wilk check, QQ plots | 4-5 |
| Chi-squared test | Tilt effect (miss autocorrelation) | 6 |
| t-distribution, CLT | Paired t-test validity | 7-8 |
| Confidence intervals | 95% CI for mean differences | 9 |
| Paired t-test | H₁ (RT) and H₂ (error) between conditions | 10 |
| Shapiro-Wilk / GoF | Assumption check before t-test | 10 |
| One vs two-tailed | Justified for each hypothesis | 10 |
| Type I/II errors | Discuss in analysis section | 10 |
| Simple linear regression | SAT regression (error ~ RT) per condition | 11 |
| Residual analysis | Model checking for regression | 11 |
| Multiple regression | Interaction model: error ~ RT × condition (H₃) | 12-13 |

**Key decision:** For H₃, use `lm(error ~ rt * condition)` (multiple regression, Week 12-13) instead of Fisher's z-test (not in syllabus). The interaction term tests whether SAT slopes differ — same scientific question, better course alignment.

**Cohen's d** is not explicitly in the syllabus but is trivially mean(d)/sd(d) — basic Week 1 material. Standard practice for reporting effect sizes alongside t-tests.

---

## R Package Requirements

```r
# Core
library(tidyverse)   # dplyr, ggplot2, readr, tidyr
library(car)         # leveneTest

# Optional
library(effsize)     # cohen.d()
library(cocor)       # comparing correlations (if available)
library(ggpubr)      # publication-ready plots (optional)
```

---

## Output Checklist

Before submitting, verify:
- [ ] All figures are PDF format in `../report/figures/`
- [ ] Descriptive stats match between R output and report text
- [ ] All p-values reported to 3 decimal places
- [ ] Cohen's d reported for every t-test
- [ ] QQ plots generated for appendix
- [ ] R code is commented and reproducible
- [ ] `00_run_all.R` runs clean from scratch
