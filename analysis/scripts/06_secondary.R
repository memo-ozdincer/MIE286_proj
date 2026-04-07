# ── 06_secondary.R ───────────────────────────────────────────────
# Secondary analyses: tilt effect, condition order, RT variance.
# Input:  output/clean_trials.rds, output/participant_means.rds
# Output: console (copy stats into report)

library(tidyverse)

ct <- readRDS("output/clean_trials.rds")
pm <- readRDS("output/participant_means.rds")

# ── Tilt Effect (miss autocorrelation) ──────────────────────────
cat("\n=== TILT EFFECT ===\n")

tilt <- ct %>%
  arrange(uid, condition, block, trial_num) %>%
  group_by(uid, condition, block) %>%
  mutate(
    prev_hit = lag(hit),
    is_miss  = 1L - hit
  ) %>%
  filter(!is.na(prev_hit)) %>%
  ungroup()

miss_after_miss <- sum(tilt$is_miss == 1 & tilt$prev_hit == 0)
total_after_miss <- sum(tilt$prev_hit == 0)
miss_after_hit <- sum(tilt$is_miss == 1 & tilt$prev_hit == 1)
total_after_hit <- sum(tilt$prev_hit == 1)

cat("P(miss | prev miss) =", miss_after_miss, "/", total_after_miss,
    "=", round(miss_after_miss / total_after_miss * 100, 1), "%\n")
cat("P(miss | prev hit)  =", miss_after_hit, "/", total_after_hit,
    "=", round(miss_after_hit / total_after_hit * 100, 1), "%\n")

# Chi-square test
tilt_mat <- matrix(c(miss_after_miss, total_after_miss - miss_after_miss,
                     miss_after_hit, total_after_hit - miss_after_hit),
                   nrow = 2, byrow = TRUE)
colnames(tilt_mat) <- c("Miss", "Hit")
rownames(tilt_mat) <- c("After Miss", "After Hit")
cat("\nContingency table:\n")
print(tilt_mat)

tilt_test <- chisq.test(tilt_mat)
cat("\nChi-squared test:\n")
print(tilt_test)

# ── Condition Order Check ────────────────────────────────────────
cat("\n=== CONDITION ORDER CHECK ===\n")

va <- pm %>% filter(order == "VA")
av <- pm %>% filter(order == "AV")
cat("VA group: n =", nrow(va), "\n")
cat("AV group: n =", nrow(av), "\n")

# Overall mean RT per participant
pm$overall_rt <- (pm$mean_rt_visual + pm$mean_rt_auditory) / 2

order_test <- t.test(overall_rt ~ order, data = pm)
cat("\nIndependent t-test: Overall RT by condition order\n")
print(order_test)

cat("\nMean RT — VA:", round(mean(va$mean_rt_visual + va$mean_rt_auditory) / 2, 1),
    "ms, AV:", round(mean(av$mean_rt_visual + av$mean_rt_auditory) / 2, 1), "ms\n")

# ── RT Variance Comparison ──────────────────────────────────────
cat("\n=== RT VARIANCE COMPARISON ===\n")

var_vis <- var(pm$mean_rt_visual)
var_aud <- var(pm$mean_rt_auditory)
cat("Visual RT variance:", round(var_vis, 1), "(SD =", round(sqrt(var_vis), 1), ")\n")
cat("Auditory RT variance:", round(var_aud, 1), "(SD =", round(sqrt(var_aud), 1), ")\n")

var_test <- var.test(pm$mean_rt_visual, pm$mean_rt_auditory)
cat("\nF-test for variance equality:\n")
print(var_test)

cat("\n=== DONE: 06_secondary.R ===\n")
